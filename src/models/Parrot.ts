// Parrot.ts
import { Animal } from "./Animal";

export class Parrot extends Animal {
    makeSound(): void {
        console.log(`${this.name} squawks! 🦜`);
    }
}
