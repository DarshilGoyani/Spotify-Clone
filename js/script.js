let currentSong = new Audio();
let play = document.getElementById("play");
let songs
let currFolder
let allSongs

function secondsToMinuteSeconds(seconds){
    if(isNaN(seconds) || seconds < 0){
        return "Invalid input";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder){
    currFolder = folder

    if (!allSongs) {
        const res = await fetch(`/songs.json`, { cache: "no-store" });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Failed to load /songs.json (${res.status} ${res.statusText}). Response starts with: ${text.slice(0, 60)}`);
        }
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            const text = await res.text().catch(() => "");
            throw new Error(`Expected JSON from /songs.json but got '${contentType}'. Response starts with: ${text.slice(0, 60)}`);
        }
        allSongs = await res.json();
    }

    const normalizedFolder = `/${folder}`.replace(/\/+/g, "/").replace(/\/\//g, "/").replace(/\/+$/g, "");
    const list = Array.isArray(allSongs) ? allSongs : (allSongs.songs || []);

    songs = list
        .map((s) => {
            if (typeof s === "string") {
                return { title: s.split("/").pop(), path: s };
            }
            return {
                title: s.title || (s.path ? s.path.split("/").pop() : ""),
                path: s.path || s.url || "",
                folder: s.folder
            };
        })
        .filter((s) => {
            if (!s.path) return false;
            if (s.folder) return `/${s.folder}`.replace(/\/+$/g, "") === normalizedFolder;
            return s.path.startsWith(normalizedFolder + "/");
        });

    // show all the songs in the [playlists]
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `
                    <li class="d-flex align-items-center rounded-2 transition-3 px-3 py-2">
                        <span><i class="fa-light fa-music text-white"></i></span>
                        <div class="d-flex ms-3 w-100 align-items-center justify-content-between">
                            <div class="info d-block">
                                <h6 class="mb-0">${(song.title || "").replaceAll("%20", " ")}</h6>
                            <p class="mb-0">Artist Name</p>
                            </div>
                            <div class="song-play"><i class="fa-light fa-play"></i></div>
                        </div>
                    </li>`;
    }

    // attach an event listener to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            console.log(e.querySelector(".info").firstElementChild.innerHTML)
            let selected = songs.find(s => (s.title || "").replaceAll("%20", " ") === e.querySelector(".info").firstElementChild.innerHTML.trim());
            if (selected) {
                playMusic(selected.path);
            }

        })
    })

    return songs;    
}

const playMusic = (track, pause = false) => {
    const raw = (track || "").trim();
    const trackUrlRaw = (raw.startsWith("/") ? raw : `/${currFolder}/${raw}`).replace(/\/+/g, "/");
    const trackUrl = (() => {
        const parts = trackUrlRaw.split("/");
        return parts
            .map((p, i) => {
                if (i === 0 && p === "") return "";
                return encodeURIComponent(decodeURIComponent(p));
            })
            .join("/");
    })();
    currentSong.src = trackUrl;
    if(!pause){
        currentSong.play().catch((e) => {
            console.error("Audio play failed for:", currentSong.src, e);
        })
        play.innerHTML = `<i class="fa-solid fa-pause"></i>`
    }else {
        play.innerHTML = `<i class="fa-solid fa-play"></i>`; 
    }
    let cleanName = decodeURIComponent(raw.split("/").pop() || raw).replace(".mp3", "");
    document.querySelector(".song-detail h6").innerHTML = cleanName;
}

async function displayAlbums(){
    let cardContainer = document.querySelector(".card-container")
    if (!cardContainer) return;

    const cards = Array.from(cardContainer.getElementsByClassName("card"));
    await Promise.all(cards.map(async (card) => {
        const folder = card.dataset.folder;
        if (!folder) return;
        try {
            const res = await fetch(`/songs/${encodeURIComponent(folder)}/info.json`, { cache: "no-store" });
            const data = await res.json();
            const titleEl = card.querySelector("h6");
            const descEl = card.querySelector("p");
            if (titleEl && data.title) titleEl.textContent = data.title;
            if (descEl && data.description) descEl.textContent = data.description;
        } catch (e) {
        }
    }));
}

async function main(){
    // get the list of all the songs
    songs = await getSongs("songs/Hindi Songs"); 

    if (songs.length > 0) {
        playMusic(songs[0].path, true)
    }

    // display all the albums on the page
    displayAlbums()

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play().catch((e) => {
                console.error("Audio play failed for:", currentSong.src, e);
            });
            play.innerHTML = `<i class="fa-solid fa-pause"></i>`;
        } else {
            currentSong.pause();
            play.innerHTML = `<i class="fa-solid fa-play"></i>`;
        }
    });

    // listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector("#startTime").innerHTML = `${secondsToMinuteSeconds(currentSong.currentTime)}`
        document.querySelector("#endTime").innerHTML = `${secondsToMinuteSeconds(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";

    })

    // listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector("#startTime").innerHTML = `${secondsToMinuteSeconds(currentSong.currentTime)}`
        document.querySelector("#endTime").innerHTML = `${secondsToMinuteSeconds(currentSong.duration)}`

        let progress = (currentSong.currentTime / currentSong.duration) * 100;
        document.querySelector(".circle").style.left = progress + "%";
    });

    // add an event listener to seekbar to change its color to green c    
    document.querySelector(".seekbar").addEventListener("click", e => {
        let seekbar = e.currentTarget.getBoundingClientRect();
        let percent = (e.clientX - seekbar.left) / seekbar.width;

        currentSong.currentTime = percent * currentSong.duration; 
        document.querySelector(".circle").style.left = (percent * 100) + "%";
    });

    currentSong.addEventListener("timeupdate", () => {
        let progress = (currentSong.currentTime / currentSong.duration) * 100;
    
        document.querySelector(".progress").style.width = progress + "%"; // white bar fill
        document.querySelector(".circle").style.left = progress + "%";   // circle move
    
        document.querySelector("#startTime").innerHTML = secondsToMinuteSeconds(currentSong.currentTime);
        document.querySelector("#endTime").innerHTML = secondsToMinuteSeconds(currentSong.duration);
    });

    // add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector("aside").style.left = "0"
    })
    
    // add an event listener for hamburger to close it
    document.querySelector(".aside-close").addEventListener("click", () => {
        document.querySelector("aside").style.left = "-100%"
    })

    // add an event listener for previous
    document.querySelector("#previous").addEventListener("click", () => {
        let currentFile = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);
        let index = songs.findIndex(s => (s.path.split("/").pop() || "") === currentFile)
        if ((index-1) >= 0) {
            playMusic(songs[index-1].path)
        }
    })

    // add an event listener for next
    document.querySelector("#next").addEventListener("click", () => {
        let currentFile = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);
        let index = songs.findIndex(s => (s.path.split("/").pop() || "") === currentFile)
        if ((index+1) < songs.length) {
            playMusic(songs[index+1].path)
        }
    })

    // add an event listener for volume
    const volumeInput = document.querySelector('.range input[type="range"]');
    if (volumeInput) {
        const setVol = () => {
            const v = Number(volumeInput.value);
            if (Number.isFinite(v)) currentSong.volume = Math.min(1, Math.max(0, v / 100));
        };
        volumeInput.addEventListener("input", setVol);
        setVol();
    }
    
    // load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e=>{
        e.addEventListener("click", async item =>{
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)

            if (songs.length > 0) {
            playMusic(songs[0].path, true);
        }
        })
    })

}
main();