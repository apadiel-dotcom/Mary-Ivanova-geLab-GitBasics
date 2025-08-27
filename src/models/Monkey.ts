// Monkey.ts
import { Animal } from "./Animal";

export class Monkey extends Animal {
    makeSound(): void {
        console.log(`${this.name} chatters! 🐒`);
    }
}
