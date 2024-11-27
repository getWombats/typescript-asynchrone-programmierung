import fetch, { Response } from "node-fetch";
import { map, mergeMap, toArray } from "rxjs/operators";
import { get } from "./utils";
import { of } from "rxjs";

/* 
Read data from https://swapi.dev/api/people/1 (Luke Skywalker)
and dependent data from swapi to return the following object

{
    name: 'Luke Skywalker',
    height: 172,
    gender: 'male',
    homeworld: 'Tatooine',
    films: [
        {
            title: 'A New Hope',
            director: 'George Lucas',
            release_date: '1977-05-25'
        },
        ... // and all other films
    ]
}

Define an interface of the result type above and all other types as well.

*/

interface Person {
  name: string;
  height: string;
  gender: "male" | "female" | "divers";
  homeworld: string;
  films: string[];
}

export interface PersonInfo {
  name: string;
  height: string;
  gender: "male" | "female" | "divers";
  homeworld: string;
  films: Film[];
}

export interface Film {
  title: string;
  director: string;
  release_date: string;
}

export interface Homeworld {
  name: string;
}

const apiUrl: string = "https://swapi.dev/api/people/1";

// Task 1: write a function using promise based fetch api
type PromiseBasedFunction = () => Promise<PersonInfo>;
export const getLukeSkywalkerInfo: PromiseBasedFunction = () => {
  return fetch(apiUrl).then((response: Response) => {
    return response.json().then(async (person: Person) => {
      const homeWorldResponse = await fetch(person.homeworld);
      const homeworldData = await homeWorldResponse.json();
      const filmPromises = person.films.map((filmUrl) =>
        fetch(filmUrl).then((res) => res.json())
      );
      const filmsData = await Promise.all(filmPromises);
      return {
        name: person.name,
        height: person.height,
        gender: person.gender,
        homeworld: homeworldData.name,
        films: filmsData.map((film: any) => ({
          title: film.title,
          director: film.director,
          release_date: film.release_date,
        })),
      } as PersonInfo;
    });
  });
};

// Task 2: write a function using async and await
// see also: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-1-7.html
type AsyncBasedFunction = () => Promise<PersonInfo>;
export const getLukeSkywalkerInfoAsync: PromiseBasedFunction = async () => {
  const response = await fetch(apiUrl);
  const person = await response.json();
  const homeWorldResponse = await fetch(person.homeworld);
  const homeWorldData = await homeWorldResponse.json();
  const filmPromises = person.films.map((filmUrl: fetch.RequestInfo) =>
    fetch(filmUrl).then((res) => res.json())
  );
  const filmsData = await Promise.all(filmPromises);
  return (await {
    name: person.name,
    height: person.height,
    gender: person.gender,
    homeworld: homeWorldData.name,
    films: filmsData.map((film: any) => ({
      title: film.title,
      director: film.director,
      release_date: film.release_date,
    })),
  }) as PersonInfo;
};

// Task 3: write a function using Observable based api
// see also: https://rxjs.dev/api/index/function/forkJoin
export const getLukeSkywalkerInfoObservable = () => {
  return get<Person>(apiUrl).pipe(
    mergeMap((person: Person) => {
      const homeworld$ = get<Homeworld>(person.homeworld);
      const films$ = of(person.films).pipe(
        mergeMap((films) => films),
        mergeMap((film) => get<Film>(film)),
        toArray()
      );
      return of(person).pipe(
        mergeMap((person) =>
          homeworld$.pipe(
            map((homeworld) => ({ ...person, homeworld: homeworld.name }))
          )
        ),
        mergeMap((person) =>
          films$.pipe(
            map(
              (films) =>
                ({
                  name: person.name,
                  height: person.height,
                  gender: person.gender,
                  homeworld: person.homeworld,
                  films: films.map((film: Film) => ({
                    title: film.title,
                    director: film.director,
                    release_date: film.release_date,
                  })),
                } as PersonInfo)
            )
          )
        )
      );
    })
  );
};

// Run npx ts-node main.ts
//Task 1: promise based function
getLukeSkywalkerInfo().then(console.log);
// Task 2: async based function
getLukeSkywalkerInfoAsync().then(console.log);
// Task 3: observable based function
getLukeSkywalkerInfoObservable().subscribe(console.log);
