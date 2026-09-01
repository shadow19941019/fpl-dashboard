from flask import Flask, render_template, jsonify
import requests
import time
from functools import lru_cache

from functools import lru_cache


@lru_cache(maxsize=50)
def get_all_manager_picks_for_gw(gw):

    all_picks = {}

    for manager_name, entry_id in NAME_MAP.items():

        try:
            picks_data = get_manager_picks(
                entry_id,
                gw
            )

            all_picks[manager_name] = picks_data["picks"]

        except requests.HTTPError:
            continue

    return all_picks

@lru_cache(maxsize=500)
def get_cached_manager_picks(entry_id, gw):

    return fpl_get(
        f"entry/{entry_id}/event/{gw}/picks/"
    )


LEAGUE_ID = 654619
FPL_API = "https://fantasy.premierleague.com/api"


NAME_MAP = {
    "Ricsi": 5017827,
    "Sanyi": 3319964,
    "Toni": 954872,
    "Benji": 4005446,
    "Bala": 3186262,
    "Lazi": 3202215,
    "Zolka": 3262894,
    "Gabesz": 3190229,
    "Ácska": 3314113,
    "Ákos": 3378768
}


app = Flask(__name__)

CACHE_DURATION = 300  # 5 perc

dashboard_cache = {
    "data": None,
    "timestamp": 0
}

session = requests.Session()


def fpl_get(endpoint):
    url = f"{FPL_API}/{endpoint}"

    response = session.get(
        url,
        timeout=15
    )

    response.raise_for_status()

    return response.json()


def get_manager_history(entry_id):
    return fpl_get(
        f"entry/{entry_id}/history/"
    )


def get_manager_picks(entry_id, gw):

    return get_cached_manager_picks(
        entry_id,
        gw
    )


def get_manager_transfers(entry_id):
    return fpl_get(
        f"entry/{entry_id}/transfers/"
    )


@lru_cache(maxsize=50)
def get_live_points(gw):

    data = fpl_get(
        f"event/{gw}/live/"
    )

    return {
        player["id"]: player["stats"]["total_points"]
        for player in data["elements"]
    }


def calculate_transfer_advantage(
    transfers,
    gw,
    live_points
):

    advantage = 0

    gw_transfers = [
        transfer
        for transfer in transfers
        if transfer["event"] == gw
    ]

    for transfer in gw_transfers:

        player_in = transfer["element_in"]
        player_out = transfer["element_out"]

        points_in = live_points.get(
            player_in,
            0
        )

        points_out = live_points.get(
            player_out,
            0
        )

        advantage += (
            points_in
            - points_out
        )

    return advantage


def build_raw_data():

    rows = []

    for manager_name, entry_id in NAME_MAP.items():

        history_data = get_manager_history(
            entry_id
        )

        transfers = get_manager_transfers(
            entry_id
        )

        for gw_data in history_data["current"]:

            gw = gw_data["event"]

            try:
                picks_data = get_cached_manager_picks(
                    entry_id,
                    gw
                )

            except requests.HTTPError:
                continue

            live_points = get_live_points(
                gw
            )

            # CAPTAIN POINTS

            captain_points = 0

            for pick in picks_data["picks"]:
                if pick["is_captain"]:
                    player_points = live_points.get(
                        pick["element"],
                        0
                    )

                    captain_points = (
                            player_points
                            * pick["multiplier"]
                    )

                    break

            # =========================
            # BENCH POINTS
            # =========================

            if picks_data.get("active_chip") == "bboost":

                bench_points = 0

            else:

                bench_points = 0

                if picks_data.get("active_chip") != "bboost":

                    for pick in picks_data["picks"]:

                        if pick["position"] > 11:
                            bench_points += live_points.get(
                                pick["element"],
                                0
                            )

            # TRANSFER ADVANTAGE

            transfer_advantage = (
                calculate_transfer_advantage(
                    transfers,
                    gw,
                    live_points
                )
            )

            rows.append({
                "GW": gw,
                "Name": manager_name,
                "GW points": gw_data["points"],
                "Sum points up to GW": gw_data["total_points"],
                "Captain points": captain_points,
                "Transfers": gw_data["event_transfers"],
                "Net advantage from transfer": transfer_advantage,
                "Points left on bench": bench_points
            })

    return rows

def add_calculated_stats(rows):

    gameweeks = sorted(
        set(
            row["GW"]
            for row in rows
        )
    )

    managers = list(
        NAME_MAP.keys()
    )

    manager_history = {
        manager: []
        for manager in managers
    }

    total_bench_history = {
        manager: 0
        for manager in managers
    }

    gw_wins = {
        manager: 0
        for manager in managers
    }

    gw_top3 = {
        manager: 0
        for manager in managers
    }

    captain_total = {
        manager: 0
        for manager in managers
    }

    for gw in gameweeks:

        gw_rows = [
            row
            for row in rows
            if row["GW"] == gw
        ]

        # GW RANKING

        sorted_gw = sorted(
            gw_rows,
            key=lambda row: row["GW points"],
            reverse=True
        )

        for position, row in enumerate(
            sorted_gw,
            start=1
        ):

            row["GW ranking"] = position

            if position == 1:
                gw_wins[
                    row["Name"]
                ] += 1

            if position <= 3:
                gw_top3[
                    row["Name"]
                ] += 1

        # OVERALL RANKING

        sorted_total = sorted(
            gw_rows,
            key=lambda row:
                row["Sum points up to GW"],
            reverse=True
        )

        for position, row in enumerate(
            sorted_total,
            start=1
        ):

            row["Ranking"] = position

        # BENCH RANKING

        sorted_bench = sorted(
            gw_rows,
            key=lambda row:
                row["Points left on bench"],
            reverse=True
        )

        for position, row in enumerate(
            sorted_bench,
            start=1
        ):

            row[
                "GW Bench Ranking"
            ] = position

        # CUMULATIVE STATS

        for row in gw_rows:

            manager = row["Name"]
            points = row["GW points"]

            manager_history[
                manager
            ].append(points)

            total_bench_history[
                manager
            ] += row[
                "Points left on bench"
            ]

            captain_total[
                manager
            ] += row[
                "Captain points"
            ]

            history = manager_history[
                manager
            ]

            row["Average GW points"] = (
                sum(history)
                / len(history)
            )

            row["Max GW points"] = max(
                history
            )

            row["Min GW points"] = min(
                history
            )

            row["Number of GW wins"] = (
                gw_wins[manager]
            )

            row["Number of GW TOP3"] = (
                gw_top3[manager]
            )

            row[
                "Total points left on bench"
            ] = total_bench_history[
                manager
            ]

            row[
                "Average points left on bench"
            ] = (
                total_bench_history[
                    manager
                ]
                / len(history)
            )

            total_points = row[
                "Sum points up to GW"
            ]

            if total_points > 0:

                row[
                    "Captain points/total points [%]"
                ] = (
                    captain_total[
                        manager
                    ]
                    / total_points
                    * 100
                )

            else:

                row[
                    "Captain points/total points [%]"
                ] = 0

    return rows

def get_dashboard_data():

    current_time = time.time()

    cache_is_valid = (
        dashboard_cache["data"] is not None
        and
        current_time - dashboard_cache["timestamp"] < CACHE_DURATION
    )

    if cache_is_valid:
        print("Dashboard betöltése cache-ből")
        return dashboard_cache["data"]

    print("Dashboard frissítése FPL API-ból")

    raw_data = build_raw_data()

    data = add_calculated_stats(
        raw_data
    )

    dashboard_cache["data"] = data
    dashboard_cache["timestamp"] = current_time

    return data

@app.route("/")
def home():

    data = get_dashboard_data()

    return render_template(
        "index.html",
        data=data
    )

@app.route("/api/refresh")
def refresh_dashboard():

    dashboard_cache["data"] = None
    dashboard_cache["timestamp"] = 0

    data = get_dashboard_data()

    return jsonify({
        "message": "Dashboard frissítve",
        "rows": len(data)
    })

@app.route("/api/team/<manager_name>/<int:gw>")
def get_team(manager_name, gw):

    entry_id = NAME_MAP.get(manager_name)

    if entry_id is None:
        return jsonify({
            "error": f"Nem található manager: {manager_name}"
        }), 404

    # Adott GW csapatának lekérése
    picks_url = (
        f"{FPL_API}/entry/{entry_id}/event/{gw}/picks/"
    )

    picks_response = requests.get(
        picks_url,
        timeout=10
    )

    if picks_response.status_code == 404:
        return jsonify({
            "error": f"A Gameweek {gw} csapatadata még nem érhető el az FPL-ben."
        }), 404

    picks_response.raise_for_status()

    picks_data = picks_response.json()


    # Játékosadatok lekérése
    bootstrap_url = f"{FPL_API}/bootstrap-static/"

    bootstrap_response = requests.get(
        bootstrap_url,
        timeout=10
    )

    bootstrap_response.raise_for_status()

    bootstrap_data = bootstrap_response.json()


    players_by_id = {
        player["id"]: player
        for player in bootstrap_data["elements"]
    }


    position_names = {
        1: "GK",
        2: "DEF",
        3: "MID",
        4: "FWD"
    }


    team = []

    for pick in picks_data["picks"]:

        player = players_by_id.get(
            pick["element"]
        )

        if player is None:
            continue

        team.append({
            "id": player["id"],
            "name": player["web_name"],
            "position": position_names.get(
                player["element_type"],
                "-"
            ),
            "pick_position": pick["position"],
            "multiplier": pick["multiplier"],
            "captain": pick["is_captain"],
            "vice_captain": pick["is_vice_captain"]
        })


    return jsonify({
        "manager": manager_name,
        "entry_id": entry_id,
        "gw": gw,
        "team": team
    })

@app.route("/api/league")
def get_league():

    url = (
        f"{FPL_API}/leagues-classic/"
        f"{LEAGUE_ID}/standings/"
    )

    response = requests.get(url, timeout=10)
    response.raise_for_status()

    data = response.json()

    managers = []

    for manager in data["standings"]["results"]:
        managers.append({
            "entry_id": manager["entry"],
            "player_name": manager["player_name"],
            "team_name": manager["entry_name"]
        })

    return jsonify(managers)

@app.route("/api/player-owners/<int:player_id>/<int:gw>")
def get_player_owners(player_id, gw):

    owners = []

    all_manager_picks = get_all_manager_picks_for_gw(
        gw
    )

    for manager_name, picks in all_manager_picks.items():

        for pick in picks:

            if pick["element"] == player_id:

                owners.append({
                    "manager": manager_name,
                    "captain": pick["is_captain"],
                    "vice_captain": pick["is_vice_captain"],
                    "starter": pick["position"] <= 11
                })

                break

    return jsonify({
        "player_id": player_id,
        "gw": gw,
        "count": len(owners),
        "owners": owners
    })

if __name__ == '__main__':
    app.run(debug=True)