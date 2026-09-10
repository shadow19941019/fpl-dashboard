// ==============================
// GLOBAL VARIABLES
// ==============================

let allData = [];
let currentData = [];

let sortKey = "Ranking";
let sortDirection = "asc";
let mainChart = null;

const managerColors = {
    "Bala": "#e82210c4",
    "Ricsi": "#00D9FF",
    "Sanyi": "#848383",
    "Toni": "#FFD600",
    "Benji": "#FF7A00",
    "Lazi": "#44c730",
    "Zolka": "#0541c2",
    "Gabesz": "#9255a4",
    "Ácska": "#84ed8a",
    "Ákos": "#FFFFFF"
};


// ==============================
// DOM ELEMENTS
// ==============================

const gwSelect = document.getElementById("gwSelect");
const previousGW =
    document.getElementById("previousGW");

const nextGW =
    document.getElementById("nextGW");
const playerSelect = document.getElementById("playerSelect");
const tableBody = document.getElementById("tableBody");
const podiumContainer = document.getElementById("podiumContainer");

const playerCount = document.getElementById("playerCount");
const currentGW = document.getElementById("currentGW");
const tableSubtitle = document.getElementById("tableSubtitle");
const refreshButton =
    document.getElementById("refreshButton");

const refreshButtonText =
    document.getElementById("refreshButtonText");

const chartSelect =
    document.getElementById("chartSelect");

const chartTitle =
    document.getElementById("chartTitle");

const chartDescription =
    document.getElementById(
        "chartDescription"
    );




// ==============================
// LOAD DATA FROM FLASK
// ==============================

function loadData() {

    // Ellenőrizzük, hogy Flaskból megérkezett-e az adat
    if (typeof allDataFromFlask === "undefined") {

        console.error("Az allDataFromFlask változó nem található.");

        tableBody.innerHTML = `
            <tr>
                <td colspan="23" class="text-center text-danger py-5">
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
    createChart("overall");
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
        ${formatNumber(
            player["Average GW points"]
        )}
    </strong>

    <small>
        Átlagpont
    </small>

</div>

                        </div>

                    </div>

                </div>
            `;
        }

    ).join("");
}

function sortTable(key) {

    if (sortKey === key) {

        // Ha ugyanarra kattintunk újra,
        // megfordítjuk a sorrendet
        sortDirection =
            sortDirection === "asc"
                ? "desc"
                : "asc";

    } else {

        sortKey = key;

        // Ezeknél az 1. hely a legjobb,
        // ezért első kattintásra növekvő sorrend
        const ascendingColumns = [
    "Ranking",
    "GW",
    "GW ranking",
    "GW Bench Ranking",
    "Total Bench Ranking",
    "Name"
];

if (ascendingColumns.includes(key)) {
    sortDirection = "asc";
} else {
    sortDirection = "desc";
}
    }


    currentData.sort((a, b) => {

        let valueA = a[key];
        let valueB = b[key];

        const numberA = Number(valueA);
        const numberB = Number(valueB);


        // SZÁMOK RENDEZÉSE

        if (
            !isNaN(numberA) &&
            !isNaN(numberB)
        ) {

            return sortDirection === "asc"
                ? numberA - numberB
                : numberB - numberA;
        }


        // SZÖVEGEK RENDEZÉSE

        valueA = String(valueA);
        valueB = String(valueB);

        return sortDirection === "asc"
            ? valueA.localeCompare(valueB, "hu")
            : valueB.localeCompare(valueA, "hu");
    });


    renderTable(currentData);

    updateSortIndicators();
}

document.querySelectorAll(".sortable").forEach(header => {

    header.addEventListener("click", function () {

        const key = this.dataset.key;

        sortTable(key);
    });
});

function updateSortIndicators() {

    document.querySelectorAll(".sortable").forEach(header => {

        header.classList.remove(
            "sort-asc",
            "sort-desc"
        );

        if (header.dataset.key === sortKey) {

            header.classList.add(
                sortDirection === "asc"
                    ? "sort-asc"
                    : "sort-desc"
            );
        }
    });
}

// ==============================
// RENDER CHART
// ==============================
function createChart(type = "overall") {

    const chartElement =
        document.querySelector("#mainChart");

    if (!chartElement) {
        return;
    }

    const gameweeks = [
        ...new Set(
            allData.map(row => Number(row.GW))
        )
    ].sort((a, b) => a - b);

    const managers = [
        ...new Set(
            allData.map(row => row.Name)
        )
    ];

    let dataKey;

    if (type === "gwPoints") {

        dataKey = "GW points";

        chartTitle.textContent =
            "GW pontok alakulása";

        chartDescription.textContent =
            "A menedzserek Gameweek pontszámainak összehasonlítása";

    } else {

        dataKey = "Sum points up to GW";

        chartTitle.textContent =
            "Összpont alakulása";

        chartDescription.textContent =
            "A menedzserek összpontszámának alakulása Gameweek-ről Gameweek-re";
    }


    const series = managers.map(manager => {

        const managerData = allData
            .filter(
                row =>
                    row.Name === manager
            )
            .sort(
                (a, b) =>
                    Number(a.GW) -
                    Number(b.GW)
            );

        const points =
            gameweeks.map(gw => {

                const gwData =
                    managerData.find(
                        row =>
                            Number(row.GW) === gw
                    );

                if (!gwData) {
                    return null;
                }

                return Number(
                    gwData[dataKey]
                );
            });

        return {
            name: manager,
            data: points
        };
    });


    const options = {

        series: series,

        colors: managers.map(
            manager =>
                managerColors[manager]
        ),

        chart: {
            type: "line",
            height: 450,
            background: "transparent",

            toolbar: {
                show: false
            },

            zoom: {
                enabled: false
            }
        },

        stroke: {
            curve:
                type === "overall"
                    ? "smooth"
                    : "straight",

            width: 2.5
        },

        markers: {
            size: 4,
            strokeWidth: 0,

            hover: {
                size: 7
            }
        },

        dataLabels: {
            enabled: false
        },

        xaxis: {

            categories: gameweeks.map(
                gw => `GW ${gw}`
            ),

            labels: {
                style: {
                    colors:
                        gameweeks.map(
                            () =>
                                "rgba(255,255,255,0.65)"
                        )
                }
            },

            axisBorder: {
                color:
                    "rgba(255,255,255,0.08)"
            },

            axisTicks: {
                color:
                    "rgba(255,255,255,0.08)"
            }
        },

        yaxis: {
            labels: {
                style: {
                    colors: [
                        "rgba(255,255,255,0.65)"
                    ]
                }
            }
        },

        grid: {
            borderColor:
                "rgba(255,255,255,0.08)",

            strokeDashArray: 4
        },

        legend: {
            position: "top",
            horizontalAlign: "left",

            labels: {
                colors: "#ffffff"
            },

            markers: {
                width: 10,
                height: 10,
                radius: 10
            },

            itemMargin: {
                horizontal: 8,
                vertical: 6
            }
        },

        tooltip: {
            theme: "dark",
            shared: true,
            intersect: false
        }
    };


    if (mainChart) {
        mainChart.destroy();
    }

    allSeriesVisible = true;

    mainChart =
        new ApexCharts(
            chartElement,
            options
        );

    mainChart.render();
}




// ==============================
// RENDER TABLE
// ==============================

function renderTable(data) {

    if (data.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="23"
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

    <!-- ALAPADATOK -->

    <td class="basic-stat">
        <span class="ranking-badge">
            ${formatValue(player["Ranking"])}
        </span>
    </td>

    <td class="player-name basic-stat">
        <button
            class="player-link"
            data-player="${player.Name}"
        >
            ${player.Name}
        </button>
    </td>

    <td class="basic-stat">
        ${formatValue(player["GW"])}
    </td>


    <!-- TELJES STATISZTIKA -->

    <td class="total-stat total-stat-start total-points">
        ${formatValue(
            player["Sum points up to GW"]
        )}
    </td>

    <td class="total-stat">
        ${formatNumber(
            player["Average GW points"]
        )}
    </td>

    <td class="total-stat">
        ${formatValue(player["Max GW points"])}
    </td>

    <td class="total-stat">
        ${formatValue(player["Min GW points"])}
    </td>

    <td class="total-stat">
        ${formatValue(
            player["Number of GW wins"]
        )}
    </td>

    <td class="total-stat">
        ${formatValue(
            player["Number of GW TOP3"]
        )}
    </td>

    <td class="total-stat">
        ${formatNumber(
            player["Captain points/total points [%]"]
        )}%
    </td>

    <td class="total-stat">
        ${formatValue(
            player["Total transfers"]
        )}
    </td>

    <td class="total-stat">
        ${formatValue(
            player["Total transfer advantage"]
        )}
    </td>

    <td class="total-stat">
        ${formatValue(
            player["Total points left on bench"]
        )}
    </td>

    <td class="total-stat">
        ${formatValue(
            player["Total Bench Ranking"]
        )}
    </td>

    <td class="total-stat">
        ${formatNumber(
            player["Average points left on bench"]
        )}
    </td>


    <!-- GW STATISZTIKA -->

    <td class="gw-stat gw-stat-start">
        ${formatValue(player["GW ranking"])}
    </td>

    <td class="gw-stat gw-points">
        ${formatValue(player["GW points"])}
    </td>

    <td class="gw-stat">
        ${formatValue(player["Captain points"])}
    </td>

    <td class="gw-stat">
        ${formatNumber(
            player["Captain points/GW points [%]"]
        )}%
    </td>

    <td class="gw-stat">
        ${formatValue(player["Transfers"])}
    </td>

    <td class="gw-stat">
        ${formatValue(
            player["Net advantage from transfer"]
        )}
    </td>

    <td class="gw-stat">
        ${formatValue(
            player["Points left on bench"]
        )}
    </td>

    <td class="gw-stat">
        ${formatValue(
            player["GW Bench Ranking"]
        )}
    </td>

</tr>
        `;

    }).join("");

addPlayerClickEvents();
updateTopScrollbar();
}



function addPlayerClickEvents() {

    const playerLinks =
        document.querySelectorAll(".player-link");

    playerLinks.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const playerName =
                    this.dataset.player;

                showTeam(playerName);
            }
        );

    });
}

async function showTeam(playerName) {

    const gw = Number(gwSelect.value);

    const modalElement =
        document.getElementById("teamModal");

    const modal =
        new bootstrap.Modal(modalElement);

    const title =
        document.getElementById(
            "teamModalTitle"
        );

    const loading =
        document.getElementById(
            "teamLoading"
        );

    const content =
        document.getElementById(
            "teamContent"
        );


    title.textContent =
    `${playerName} – Gameweek ${gw}`;

// előző hibaüzenet törlése
loading.innerHTML = "Csapat betöltése...";

loading.classList.remove("d-none");
content.classList.add("d-none");

modal.show();


    try {

        const response = await fetch(
            `/api/team/${encodeURIComponent(
                playerName
            )}/${gw}`
        );

        const data = await response.json();


        if (!response.ok) {
            throw new Error(
                data.error ||
                "Nem sikerült betölteni a csapatot."
            );
        }


        renderTeam(data);


    } catch (error) {

        loading.innerHTML = `
            <div class="text-danger">
                ${error.message}
            </div>
        `;

    }
}

function renderTeam(data) {

    const loading =
        document.getElementById(
            "teamLoading"
        );

    const content =
        document.getElementById(
            "teamContent"
        );


    const starters =
        data.team.filter(player =>
            player.pick_position <= 11
        );


    const bench =
        data.team.filter(player =>
            player.pick_position > 11
        );


    content.innerHTML = `

        <div class="mb-4">

            <h6 class="text-secondary">
                KEZDŐ
            </h6>

            ${starters.map(player => {

                return createPlayerRow(player);

            }).join("")}

        </div>


        <div>

            <h6 class="text-secondary">
                CSEREPAD
            </h6>

            ${bench.map(player => {

                return createPlayerRow(player);

            }).join("")}

        </div>

    `;


    loading.classList.add("d-none");
    content.classList.remove("d-none");
}

function createPlayerRow(player) {

    let captainBadge = "";

    if (player.captain) {
        captainBadge = `
            <span class="badge bg-success ms-2">
                C
            </span>
        `;
    }

    if (player.vice_captain) {
        captainBadge = `
            <span class="badge bg-secondary ms-2">
                VC
            </span>
        `;
    }

    return `
        <div class="team-player">

            <div>
                <span class="
                    position-badge
                    position-${player.position.toLowerCase()}
                ">
                    ${player.position}
                </span>

                <button
    class="fpl-player-link"
    data-player-id="${player.id}"
    data-player-name="${player.name}"
>
    ${player.name}
</button>

                ${captainBadge}
            </div>

        </div>
    `;
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

const teamContent =
    document.getElementById("teamContent");


teamContent.addEventListener(
    "click",
    function (event) {

        const playerButton =
            event.target.closest(".fpl-player-link");

        if (!playerButton) {
            return;
        }


        const playerId =
            Number(playerButton.dataset.playerId);

        const playerName =
            playerButton.dataset.playerName;


        showPlayerOwners(
            playerId,
            playerName
        );
    }
);

async function showPlayerOwners(
    playerId,
    playerName
) {

    const gw = Number(gwSelect.value);


    const teamModalElement =
        document.getElementById("teamModal");

    const teamModal =
        bootstrap.Modal.getInstance(
            teamModalElement
        );


    const ownersModalElement =
        document.getElementById(
            "playerOwnersModal"
        );

    const ownersModal =
        bootstrap.Modal.getOrCreateInstance(
            ownersModalElement
        );


    const title =
        document.getElementById(
            "playerOwnersModalTitle"
        );

    const loading =
        document.getElementById(
            "playerOwnersLoading"
        );

    const content =
        document.getElementById(
            "playerOwnersContent"
        );


    title.textContent =
        `${playerName} – Gameweek ${gw}`;


    loading.innerHTML = `
        <div
            class="spinner-border spinner-border-sm me-2"
            role="status">
        </div>

        Csapatok betöltése...
    `;

    loading.classList.remove("d-none");

    content.classList.add("d-none");


    // Első modal bezárása
    if (teamModal) {
        teamModal.hide();
    }


    // Kis késleltetés, hogy szépen bezáródjon
    setTimeout(() => {
        ownersModal.show();
    }, 200);


    try {

        const response = await fetch(
            `/api/player-owners/${playerId}/${gw}`
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Nem sikerült lekérni a csapatokat."
            );
        }


        renderPlayerOwners(
            data,
            playerName
        );


    } catch (error) {

        loading.innerHTML = `
            <div class="text-danger">
                ${error.message}
            </div>
        `;
    }
}

function renderPlayerOwners(
    data,
    playerName
) {

    const loading =
        document.getElementById(
            "playerOwnersLoading"
        );

    const content =
        document.getElementById(
            "playerOwnersContent"
        );


    if (data.owners.length === 0) {

        content.innerHTML = `
            <div class="text-center text-secondary py-3">

                ${playerName}
                egyik csapatban sem szerepel
                ebben a Gameweekben.

            </div>
        `;

    } else {

        content.innerHTML = `

            <div class="mb-3 text-secondary">

                <strong>
                    ${data.count}
                </strong>

                csapatban szerepel

            </div>


            <div class="owner-list">

                ${data.owners.map(owner => {

                    let badges = "";


                    if (owner.captain) {

                        badges += `
                            <span
                                class="badge bg-success ms-2">
                                C
                            </span>
                        `;
                    }


                    if (owner.vice_captain) {

                        badges += `
                            <span
                                class="badge bg-secondary ms-2">
                                VC
                            </span>
                        `;
                    }


                    if (!owner.starter) {

                        badges += `
                            <span
                                class="badge bg-warning text-dark ms-2">
                                PAD
                            </span>
                        `;
                    }


                    return `

                        <div class="owner-row">

                            <button
    class="owner-manager-link"
    data-manager="${owner.manager}"
>
    ${owner.manager}
</button>

                            <div>
                                ${badges}
                            </div>

                        </div>
                    `;

                }).join("")}

            </div>
        `;
    }


    loading.classList.add("d-none");
    content.classList.remove("d-none");
}

const playerOwnersContent =
    document.getElementById("playerOwnersContent");


playerOwnersContent.addEventListener(
    "click",
    function (event) {

        const managerButton =
            event.target.closest(".owner-manager-link");

        if (!managerButton) {
            return;
        }

        const managerName =
            managerButton.dataset.manager;

        openManagerFromOwners(managerName);
    }
);

function openManagerFromOwners(managerName) {

    const ownersModalElement =
        document.getElementById("playerOwnersModal");

    const ownersModal =
        bootstrap.Modal.getInstance(
            ownersModalElement
        );


    if (ownersModal) {
        ownersModal.hide();
    }


    setTimeout(() => {

        showTeam(managerName);

    }, 200);
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

// ELŐZŐ GAMEWEEK

previousGW.addEventListener("click", function () {

    const currentIndex = gwSelect.selectedIndex;

    if (currentIndex > 0) {

        gwSelect.selectedIndex =
            currentIndex - 1;

        const selectedGW = Number(
            gwSelect.value
        );

        loadGW(selectedGW);
    }
});


// KÖVETKEZŐ GAMEWEEK

nextGW.addEventListener("click", function () {

    const currentIndex = gwSelect.selectedIndex;

    if (
        currentIndex <
        gwSelect.options.length - 1
    ) {

        gwSelect.selectedIndex =
            currentIndex + 1;

        const selectedGW = Number(
            gwSelect.value
        );

        loadGW(selectedGW);
    }
});

// PLAYER SEARCH

playerSelect.addEventListener("change", function () {

    const selectedPlayer = this.value;

    if (selectedPlayer === "all") {

        renderTable(currentData);

    } else {

        const playerHistory = allData.filter(player =>
            player.Name === selectedPlayer
        );

        playerHistory.sort((a, b) =>
            Number(a.GW) - Number(b.GW)
        );

        renderTable(playerHistory);
    }
});

const tableScrollTop =
    document.getElementById("tableScrollTop");

const tableScrollTopInner =
    document.getElementById("tableScrollTopInner");

const tableScrollBottom =
    document.getElementById("tableScrollBottom");

const customTable =
    document.querySelector(".custom-table");


function updateTopScrollbar() {

    tableScrollTopInner.style.width =
        `${customTable.scrollWidth}px`;
}


// alsó scrollbar → felső scrollbar
tableScrollBottom.addEventListener("scroll", function () {

    tableScrollTop.scrollLeft =
        tableScrollBottom.scrollLeft;
});


// felső scrollbar → alsó scrollbar
tableScrollTop.addEventListener("scroll", function () {

    tableScrollBottom.scrollLeft =
        tableScrollTop.scrollLeft;
});


window.addEventListener(
    "resize",
    updateTopScrollbar
);

refreshButton.addEventListener(
    "click",
    async function () {

        // Frissítés közben ne lehessen
        // újra megnyomni
        refreshButton.disabled = true;

        refreshButton.classList.add(
            "refreshing"
        );

        refreshButtonText.textContent =
            "Frissítés...";

        try {

            const response = await fetch(
                "/api/refresh"
            );

            if (!response.ok) {
                throw new Error(
                    "A frissítés sikertelen."
                );
            }

            const result =
                await response.json();

            console.log(result);

            refreshButtonText.textContent =
                "Frissítve ✓";

            // Kis visszajelzés után
            // újratöltjük az oldalt
            setTimeout(() => {

                window.location.reload();

            }, 700);

        } catch (error) {

            console.error(error);

            refreshButtonText.textContent =
                "Hiba";

            refreshButton.classList.remove(
                "refreshing"
            );

            refreshButton.disabled = false;

            setTimeout(() => {

                refreshButtonText.textContent =
                    "Adatok frissítése";

            }, 2000);
        }
    }
);

chartSelect.addEventListener(
    "change",
    function () {

        createChart(this.value);
    }
);


// ==============================
// START APPLICATION
// ==============================

loadData();

updateTopScrollbar();
