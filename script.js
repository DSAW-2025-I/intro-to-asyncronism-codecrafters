let currentPokemonCount = 50; 
const pokemonBatchSize = 50; 

function fetchPokemon(pokemonName) {
    document.getElementById("loadingSpinner").style.display = "block";

    const searchInput = document.getElementById("pokemonName");
    const errorMessage = document.getElementById("errorMessage");
    const pokemonDetails = document.getElementById("pokemonDetails");

    if (!pokemonName) {
        pokemonName = searchInput.value.toLowerCase().trim();
    }

    searchInput.value = ""; 
    errorMessage.style.display = "none"; 

document.getElementById("pokemonName").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        fetchPokemon(); 
    }
});

    try {
        fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`)
            .then(response1 => {
                if (!response1.ok) throw new Error("Pokémon no encontrado");
                return response1.json();
            })
            .then(data1 => {
                return fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`)
                    .then(response2 => response2.json())
                    .then(data2 => {
                        const descriptionEntry = data2.flavor_text_entries.find(entry => entry.language.name === "es");
                        const description = descriptionEntry ? descriptionEntry.flavor_text : "Descripción no disponible.";
                        
                        displayPokemon(data1, description, data2.evolution_chain?.url);

                        window.scrollTo({ top: 0, behavior: "smooth" });
                    });
            });
    } catch (error) {
        pokemonDetails.innerHTML = ""; 
        errorMessage.innerHTML = `<p>${error.message}</p>`;
        errorMessage.style.display = "block"; 
    }
    document.getElementById("loadingSpinner").style.display = "none";

}
function fetchRandomPokemon() {
    const randomId = Math.floor(Math.random() * 1010) + 1; 
    fetchPokemon(randomId); 
}



function displayPokemon(data, description, evolutionChainUrl) {
    const pokemonDetails = document.getElementById("pokemonDetails");

    pokemonDetails.style.display = "block"; 
    pokemonDetails.innerHTML = ""; 

    const stats = data.stats.map(stat => `
        <div class='stats-container'>
            <p><strong>${stat.stat.name.toUpperCase()}:</strong> ${stat.base_stat}</p>
        </div>
    `).join("");

    const types = data.types.map(type => `
        <span class='type-badge' style='background-color: ${getTypeColor(type.type.name)};'>${type.type.name.toUpperCase()}</span>
    `).join(" ");

    let evolutionSection = "";
    if (evolutionChainUrl) {
        evolutionSection = `<h3>Evoluciones:</h3><div id="evolutionChain" class="evolution-container"></div>`;
        fetchEvolutionChain(evolutionChainUrl);
    }

    pokemonDetails.innerHTML = `
        <div class="pokemon-card">
            <h2>${data.name.toUpperCase()} (#${data.id})</h2>
            <img src="${data.sprites.front_default}" alt="${data.name}">
            <p><strong>Descripción:</strong> ${description}</p>
            <p><strong>Altura:</strong> ${data.height / 10} m</p>
            <p><strong>Peso:</strong> ${data.weight / 10} kg</p>
            <div class='types'><strong>Tipo:</strong> ${types}</div>
            <h3>Estadísticas:</h3>
            <div class="pokemon-stats">
                ${stats}
            </div>
            ${evolutionSection}
            <button id="backToMenu" onclick="backToMenu()">Volver al menú principal</button>
        </div>
    `;

    setTimeout(() => {
        pokemonDetails.classList.add("show");
    }, 100); 

    document.getElementById("backToMenu").style.display = "block";
}




async function loadPokemonList() {
    const pokemonList = document.getElementById("pokemonList");
    if (!pokemonList) return;

    pokemonList.innerHTML = ""; 

    for (let i = 1; i <= currentPokemonCount; i++) {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
            if (!response.ok) continue;
            const data = await response.json();
            
            const pokemonCard = document.createElement("div");
            pokemonCard.classList.add("pokemon-card-list");
            pokemonCard.innerHTML = `
                <img src="${data.sprites.front_default}" alt="${data.name}">
                <p>#${data.id} ${data.name.toUpperCase()}</p>
            `;

            pokemonCard.addEventListener("click", () => fetchPokemon(data.name));

            pokemonList.appendChild(pokemonCard);
        } catch (error) {
            console.error(`Error al cargar el Pokémon ${i}:`, error);
        }
    }
}


function sortPokemon() {
    const sortOption = document.getElementById("sortOptions").value;
    const pokemonList = document.getElementById("pokemonList");
    let pokemonCards = Array.from(pokemonList.children);

    if (sortOption === "low-high") {
        pokemonCards.sort((a, b) => {
            return parseInt(a.querySelector("p").textContent.match(/\d+/)[0]) - 
                   parseInt(b.querySelector("p").textContent.match(/\d+/)[0]);
        });
    } else if (sortOption === "high-low") {
        pokemonCards.sort((a, b) => {
            return parseInt(b.querySelector("p").textContent.match(/\d+/)[0]) - 
                   parseInt(a.querySelector("p").textContent.match(/\d+/)[0]);
        });
    } else if (sortOption === "a-z") {
        pokemonCards.sort((a, b) => {
            return a.querySelector("p").textContent.localeCompare(b.querySelector("p").textContent);
        });
    } else if (sortOption === "z-a") {
        pokemonCards.sort((a, b) => {
            return b.querySelector("p").textContent.localeCompare(a.querySelector("p").textContent);
        });
    }

    pokemonList.innerHTML = "";
    pokemonCards.forEach(card => pokemonList.appendChild(card));
}

async function loadMorePokemon() {
    currentPokemonCount += pokemonBatchSize; 
    loadPokemonList(); 
}

async function fetchEvolutionChain(url) {
    try {
        const response = await fetch(url);
        const evolutionData = await response.json();
        
        const evolutionContainer = document.getElementById("evolutionChain");
        evolutionContainer.innerHTML = "";
        
        let evolution = evolutionData.chain;
        while (evolution) {
            const pokemonName = evolution.species.name;
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
            const data = await response.json();
            
            const evolutionCard = document.createElement("div");
            evolutionCard.classList.add("evolution-card");
            evolutionCard.innerHTML = `
                <img src="${data.sprites.front_default}" alt="${pokemonName}">
                <p>${pokemonName.toUpperCase()}</p>
            `;

            evolutionCard.addEventListener("click", () => fetchPokemon(pokemonName));

            evolutionContainer.appendChild(evolutionCard);
            evolution = evolution.evolves_to.length > 0 ? evolution.evolves_to[0] : null;
        }
    } catch (error) {
        console.error("Error al obtener la cadena de evolución:", error);
    }
}


function getTypeColor(type) {
    const colors = {
        normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
        grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
        ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
        rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
        steel: "#B7B7CE", fairy: "#D685AD"
    };
    return colors[type] || "#777777";
}

function backToMenu() {
    const pokemonDetails = document.getElementById("pokemonDetails");
    const errorMessage = document.getElementById("errorMessage");

    if (pokemonDetails) {
        pokemonDetails.innerHTML = "";
        pokemonDetails.style.display = "none"; 
    }

    if (errorMessage) {
        errorMessage.style.display = "none"; 
    }
}


function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

window.onload = () => {
    loadPokemonList();
};
