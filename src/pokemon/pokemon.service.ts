import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {

    constructor(
        @InjectModel(Pokemon.name)
        private readonly pokemonModel: Model<Pokemon>
    ) {}

    async create(createPokemonDto: CreatePokemonDto) {
        let response = {
            code: 100,
            message: 'created',
            description: 'Pokemon creado con éxito',
            data: null
        }
        try {
            let pokemon = {...createPokemonDto}
            pokemon.name = pokemon.name.toLowerCase()
            pokemon = await this.pokemonModel.create(pokemon)
            response.data = pokemon
        } catch (error) {
            response = this.handleException(error, {
                code: 101,
                message: `not created ${JSON.stringify(error?.keyValue)}`,
                description: `No se creo el pokemon debido a que ya se encuentra agregado`,
                data: null
            })
        }
        return response
    }

    findAll() {
        return `This action returns all pokemon`;
    }

    async findOne(id: string) {
        let response = {
            code: 104,
            message: 'found',
            description: 'Pokemon encontrado',
            data: null
        }
        try {
            let pokemon: Pokemon;
            if (!isNaN(+id)) {
                pokemon = await this.pokemonModel.findOne({
                    no: id
                })
            }
            if (!pokemon && isValidObjectId(id)) {
                pokemon = await this.pokemonModel.findById( id )
            }
            if (!pokemon) {
                pokemon = await this.pokemonModel.findOne({
                    name: id.toLowerCase().trimStart().trimEnd()
                })
            }
            response.data = pokemon
            if (!pokemon) {
                response.code = 105
                response.message = 'not found',
                response.description = `No se encontró ningun pokemon`
            }
        } catch (error) {
            response.code = HttpStatus.INTERNAL_SERVER_ERROR
            response.message = 'Internal Server Error',
            response.description = 'No se puede realizar la petición debido a un error interno, por favor póngase en contacto con los responsables'
        }
        return response
    }

    async update(id: string, updatePokemonDto: UpdatePokemonDto) {
        if (updatePokemonDto?.name?.toLowerCase?.()) updatePokemonDto.name = updatePokemonDto.name.toLowerCase().trimStart().trimEnd() 
        let response = await this.findOne(id)
        try {
            if (response?.code === 104) {
                response.code = 102
                response.message = 'updated'
                response.description = 'Pokemon actualizado con éxito'
                await this.pokemonModel.updateOne({...updatePokemonDto})
                response.data = {...response.data.toJSON(), ...updatePokemonDto}
            }
        } catch (error) {
            response = this.handleException(error, {
                code: 103,
                message: `not updated ${JSON.stringify(error?.keyValue)}`,
                description: 'No se actualizo el pokemon debido a que ya existe',
                data: null
            })
        }
        return response
    }

    async remove(id: string) {
        let response = {
            code: 106,
            message: 'deleted',
            description: 'Pokemon eliminado con éxito'
        }
        try {
            const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id })
            if (deletedCount === 0) {
                response.code = 107
                response.message = 'not deleted'
                response.description = 'Pokemon eliminado debido a que no existe'
            }
        } catch (error) {
            response = this.handleException(error, {
                code: 107,
                message: `not deleted ${JSON.stringify(error?.keyValue)}`,
                description: 'No se eliminó el pokemon debido a que no existe',
                data: null
            })
        }
        return response
    }

    private handleException(error: any, auxResponse: any) {
        let response = {
            code: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal Server Error',
            description: 'No se puede realizar la petición debido a un error interno, por favor póngase en contacto con los responsables',
            data: null
        }
        if (error?.code === 11000) {
            response = auxResponse
        }
        return response
    }
}
