// zoo.ts
import readline from "readline";
import { Animal } from "./Animal";
import { Lion } from "./Lion";
import { Monkey } from "./Monkey";
import { Parrot } from "./Parrot";
import { Dog } from "./Dog";
import { Cat } from "./Cat";


// Массив животных
let zoo: Animal[] = [
    new Lion("Leo", 5, "Lion"),
    new Monkey("Mia", 5, "Monkey"),
    new Parrot("Kiki", 2, "Parrot")
];

// CRUD функции
function addAnimal(zoo: Animal[], animal: Animal): void {
    zoo.push(animal);
    console.log(`${animal.name} the ${animal.species} was added to the zoo.`);
}

function removeAnimal(zoo: Animal[], name: string): void {
    const index = zoo.findIndex(a => a.name === name);
    if (index !== -1) {
        const removed = zoo.splice(index, 1)[0];
        console.log(`${removed.name} the ${removed.species} was removed from the zoo.`);
    } else {
        console.log(`Animal with name ${name} not found.`);
    }
}

function showAnimals(zoo: Animal[]): void {
    console.log("Zoo animals:");
    for (let a of zoo) {
        console.log(`${a.name} is a ${a.species} aged ${a.age}`);
    }
}

function makeAllSounds(zoo: Animal[]): void {
    for (let a of zoo) {
        a.makeSound();
    }
}

// Дженерик функция
function addAnimalGeneric<T extends Animal>(zoo: T[], animal: T): void {
    zoo.push(animal);
    console.log(`${animal.name} the ${animal.species} was added via generic.`);
}

// Добавляем Симбу по умолчанию
addAnimalGeneric(zoo, new Lion("Simba", 2, "Lion"));

// Пример вывода
showAnimals(zoo);
makeAllSounds(zoo);

// === Интерактивное меню ===
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showMenu(): void {
    console.log("\n=== ZOO Menu ===");
    console.log("1 - Show all animals");
    console.log("2 - Make all animals sound");
    console.log("3 - Add animal");
    console.log("4 - Remove animal");
    console.log("5 - Exit");
    rl.question("Choose an option: ", handleMenu);
}

function handleMenu(choice: string): void {
    switch (choice) {
        case "1":
            showAnimals(zoo);
            showMenu();
            break;
        case "2":
            makeAllSounds(zoo);
            showMenu();
            break;
        case "3":
            rl.question("Enter animal type (Lion/Monkey/Parrot/Dog/Cat): ", (type: string) => {
                rl.question("Enter name: ", (name: string) => {
                    rl.question("Enter age: ", (ageStr: string) => {
                        const age = parseInt(ageStr);
                        let animal: Animal;
                        switch (type) {
                            case "Lion":
                                animal = new Lion(name, age, type);
                                break;
                            case "Monkey":
                                animal = new Monkey(name, age, type);
                                break;
                            case "Parrot":
                                animal = new Parrot(name, age, type);
                                break;
                            case "Dog":
                                animal = new Dog(name, age, type);
                                break;
                                case "Cat":
        animal = new Cat(name, age, type);
        break;
                            default:
                                console.log("Unknown animal type.");
                                showMenu();
                                return;
                        }
                        addAnimalGeneric(zoo, animal);
                        showMenu();
                    });
                });
            });
            break;
        case "4":
            rl.question("Enter name of animal to remove: ", (name: string) => {
                removeAnimal(zoo, name);
                showMenu();
            });
            break;
        case "5":
            console.log("Exiting ZOO...");
            rl.close();
            break;
        default:
            console.log("Invalid choice.");
            showMenu();
    }
}

// Запуск интерактивного меню
console.log("Welcome to the Interactive ZOO!");
showMenu();
