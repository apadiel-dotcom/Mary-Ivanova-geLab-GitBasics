// Lion.ts
import { Animal } from "./Animal";

export class Lion extends Animal {
    makeSound(): void {
        console.log(`${this.name} roars! 🦁`);
    }
}
