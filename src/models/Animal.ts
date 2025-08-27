// Animal.ts
import { IAnimal } from "./IAnimal";

export class Animal implements IAnimal {
    name: string;
    age: number;
    species: string;

    constructor(name: string, age: number, species: string) {
        this.name = name;
        this.age = age;
        this.species = species;
    }

    makeSound(): void {
        console.log(`${this.name} makes a sound`);
    }
}
