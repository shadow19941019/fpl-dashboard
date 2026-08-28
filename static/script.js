// ==============================
// GLOBAL VARIABLES
// ==============================

let allData = [];
let currentData = [];


// ==============================
// DOM ELEMENTS
// ==============================

const gwSelect = document.getElementById("gwSelect");
const playerSelect = document.getElementById("playerSelect");
const tableBody = document.getElementById("tableBody");
const podiumContainer = document.getElementById("podiumContainer");

const playerCount = document.getElementById("playerCount");
const currentGW = document.getElementById("currentGW");
const tableSubtitle = document.getElementById("tableSubtitle");


// ==============================
// LOAD DATA FROM FLASK
// ==============================

function loadData() {

    // Ellenőrizzük, hogy Flaskból megérkezett-e az adat
    if (typeof allDataFromFlask === "undefined") {

        console.error("Az allDataFromFlask változó nem található.");

        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger py-5">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Nem sikerült betölteni az adatokat.
                </td>
            </tr>
        `;

        return;
    }


    // Flaskból kapott adatok
    allData = allDataFromFlask;


    // Üres / hibás sorok eltávolítása
    allData = allData.filter(item =>
        item.Name &&
        item.Name.trim() !== "" &&
        item.GW !== "" &&
        item.GW !== null &&
        item.GW !== undefined
    );


    console.log("Flaskból kapott adatok:", allData);


    // Gameweek selector létrehozása
    createGWSelect();
    createPlayerSelect();
}


// ==============================
// CREATE GAMEWEEK SELECT
// ==============================

function createGWSelect() {

    const gameweeks = [
        ...new Set(
            allData.map(item => Number(item.GW))
        )
    ];


    // Csak érvényes számok maradjanak
    const validGameweeks = gameweeks.filter(gw =>
        !isNaN(gw)
    );


    // Növekvő sorrend
    validGameweeks.sort((a, b) => a - b);


    // Select kiürítése
    gwSelect.innerHTML = "";


    // Optionök létrehozása
    validGameweeks.forEach(gw => {

        const option = document.createElement("option");

        option.value = gw;

        option.textContent = `Gameweek ${gw}`;

        gwSelect.appendChild(option);
    });


    // Ha nincs GW
    if (validGameweeks.length === 0) {

        console.error("Nem található érvényes Gameweek.");

        return;
    }


    // Legutolsó GW
    const latestGW = Math.max(...validGameweeks);


    gwSelect.value = latestGW;


    // GW betöltése
    loadGW(latestGW);
}


// ==============================
// LOAD SELECTED GAMEWEEK
// ==============================

function loadGW(gw) {

    currentData = allData.filter(item =>
        Number(item.GW) === Number(gw)
    );


    // Ranking szerinti rendezés
    currentData.sort((a, b) => {

        const rankA = Number(a.Ranking);
        const rankB = Number(b.Ranking);

        return rankA - rankB;
    });


    console.log(`Gameweek ${gw}:`, currentData);


    // UI frissítése
    renderTable(currentData);

    renderPodium(currentData);

    updateStats(currentData, gw);


    // Kereső törlése
    playerSelect.value = "all";
}


// ==============================
// UPDATE HEADER STATS
// ==============================

function updateStats(data, gw) {

    const uniquePlayers = new Set(
        allData.map(item => item.Name)
    );


    playerCount.textContent = uniquePlayers.size;

    currentGW.textContent = gw;


    tableSubtitle.textContent =
        `${data.length} játékos • Gameweek ${gw}`;
}


// ==============================
// RENDER PODIUM
// ==============================

function renderPodium(data) {

    podiumContainer.innerHTML = "";


    if (data.length === 0) {
        return;
    }


    const topThree = data.slice(0, 3);


    const medals = [
        "🥇",
        "🥈",
        "🥉"
    ];


    podiumContainer.innerHTML = topThree.map(
        (player, index) => {

            return `
                <div class="col-md-4 mb-3">

                    <div class="podium-card podium-${index + 1}">

                        <div class="medal">
                            ${medals[index]}
                        </div>

                        <h3>
                            ${player.Name}
                        </h3>

                        <div class="podium-points">
                            ${formatValue(
                                player["Sum points up to GW"]
                            )}
                        </div>

                        <div class="podium-label">
                            Összes pont
                        </div>

                        <hr>

                        <div class="row text-center">

                            <div class="col-6">

                                <strong>
                                    ${formatValue(
                                        player["GW points"]
                                    )}
                                </strong>

                                <small>
                                    GW pont
                                </small>

                            </div>

                            <div class="col-6">

                                <strong>
                                    ${formatValue(
                                        player["Number of GW wins"]
                                    )}
                                </strong>

                                <small>
                                    GW győzelem
                                </small>

                            </div>

                        </div>

                    </div>

                </div>
            `;
        }

    ).join("");
}


// ==============================
// RENDER TABLE
// ==============================

function renderTable(data) {

    if (data.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="18"
                    class="text-center text-secondary py-5">
                    Nem található játékos.
                </td>
            </tr>
        `;

        return;
    }


    tableBody.innerHTML = data.map(player => {

        return `
            <tr>

                <td>
                    <span class="ranking-badge">
                        ${formatValue(player["Ranking"])}
                    </span>
                </td>

                <td class="player-name">
                    ${player.Name}
                </td>

                <td>
                    ${formatValue(player["GW ranking"])}
                </td>

                <td>
                    ${formatValue(player["GW points"])}
                </td>

                <td class="total-points">
                    ${formatValue(player["Sum points up to GW"])}
                </td>

                <td>
                    ${formatNumber(player["Average GW points"])}
                </td>

                <td>
                    ${formatValue(player["Max GW points"])}
                </td>

                <td>
                    ${formatValue(player["Min GW points"])}
                </td>

                <td>
                    ${formatValue(player["Number of GW wins"])}
                </td>

                <td>
                    ${formatValue(player["Number of GW TOP3"])}
                </td>

                <td>
                    ${formatValue(player["Captain points"])}
                </td>

                <td>
                    ${formatValue(
                        player["Captain points/total points [%]"]
                    )}
                </td>

                <td>
                    ${formatValue(player["Transfers"])}
                </td>

                <td>
                    ${formatValue(
                        player["Net advantage from transfer"]
                    )}
                </td>

                <td>
                    ${formatValue(
                        player["Points left on bench"]
                    )}
                </td>

                <td>
                    ${formatValue(
                        player["Total points left on bench"]
                    )}
                </td>

                <td>
                    ${formatNumber(
                        player["Average points left on bench"]
                    )}
                </td>

                <td>
                    ${formatValue(
                        player["GW Bench Ranking"]
                    )}
                </td>

            </tr>
        `;

    }).join("");
}


// ==============================
// FORMAT VALUE
// ==============================

function formatValue(value) {

    if (
        value === "" ||
        value === null ||
        value === undefined ||
        value === "#DIV/0!"
    ) {

        return "-";
    }


    return value;
}


// ==============================
// FORMAT NUMBER
// ==============================

function formatNumber(value) {

    if (
        value === "" ||
        value === null ||
        value === undefined ||
        value === "#DIV/0!"
    ) {

        return "-";
    }


    const number = Number(
        String(value)
            .replace(",", ".")
    );


    if (isNaN(number)) {

        return value;
    }


    return number.toFixed(1);
}

function createPlayerSelect() {

    const players = [
        ...new Set(allData.map(item => item.Name))
    ];

    players.sort((a, b) =>
        a.localeCompare(b, "hu")
    );

    playerSelect.innerHTML = `
        <option value="all">Összes játékos</option>
    `;

    players.forEach(player => {

        const option = document.createElement("option");

        option.value = player;
        option.textContent = player;

        playerSelect.appendChild(option);
    });
}

// ==============================
// EVENT LISTENERS
// ==============================


// GAMEWEEK CHANGE

gwSelect.addEventListener(
    "change",
    function () {

        const selectedGW = Number(
            this.value
        );


        loadGW(selectedGW);
    }
);


// PLAYER SEARCH

playerSelect.addEventListener("change", function () {

    const selectedPlayer = this.value;

    if (selectedPlayer === "all") {

        renderTable(currentData);

    } else {

        const filteredData = currentData.filter(player =>
            player.Name === selectedPlayer
        );

        renderTable(filteredData);
    }
});


// ==============================
// START APPLICATION
// ==============================

loadData();
