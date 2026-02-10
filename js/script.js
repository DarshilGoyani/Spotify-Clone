let currentSong = new Audio();
let play = document.getElementById("play");
let songs
let currFolder
let isShuffle = false;
let isLoop = false;

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
    
    // For static deployment (Vercel), use JSON file instead of directory listing
    try {
        let response = await fetch('/songs/songs.json');
        let songsData = await response.json();
        
        // Extract folder name from path
        let folderName = folder.split('/').pop();
        songs = songsData[folderName] || [];
        
    } catch (error) {
        console.log('Falling back to directory listing for local development');
        // Fallback to original method for local development
        let a = await fetch(`/${folder}/`)
        let response = await a.text();
        let div = document.createElement("div")
        div.innerHTML = response;
        let as = div.getElementsByTagName("a")
        songs = []
        for(let index = 0; index < as.length; index++){
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                let file = element.href.substring(element.href.lastIndexOf("/") + 1);
                songs.push(file);
            }
        }
    }

    
    // show all the songs in the [playlists]
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `
                    <li class="d-flex align-items-center rounded-2 transition-3 px-3 py-2">
                        <span><i class="fa-light fa-music text-white"></i></span>
                        <div class="d-flex ms-3 w-100 align-items-center justify-content-between">
                            <div class="info d-block">
                                <h6 class="mb-0">${song.replaceAll("%20", " ")}</h6>
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
            let filename = songs.find(s => s.replaceAll("%20", " ") === e.querySelector(".info").firstElementChild.innerHTML.trim());
            if (filename) {
                playMusic(filename);
            }

        })
    })

    return songs;    
}

const playMusic = (track, pause = false) => {
    currentSong.src = `${currFolder}/` + track
    if(!pause){
        currentSong.play()
        play.innerHTML = `<i class="fa-solid fa-pause"></i>`
    }else {
        play.innerHTML = `<i class="fa-solid fa-play"></i>`; 
    }
    let cleanName = decodeURIComponent(track).replace(".mp3", "");
    document.querySelector(".song-detail h6").innerHTML = cleanName;



}

async function displayAlbums(){
    let cardContainer = document.querySelector(".card-container")
    
    // Get all available folders from songs.json
    try {
        let response = await fetch('/songs/songs.json');
        let songsData = await response.json();
        const folders = Object.keys(songsData);
        
        for (const folder of folders) {
            try {
                let infoResponse = await fetch(`/songs/${folder}/info.json`);
                let info = await infoResponse.json();
                
                cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card transition-3 overflow-hidden rounded-2 p-2">
                                    <div class="img-wrapper position-relative rounded-1 overflow-hidden">
                                        <img src="/songs/${folder}/cover.jpg" class="img-fluid" alt="img">
                                        <div class="card-play opacity-0 transition-3 position-absolute rounded-circle d-flex align-items-center justify-content-center">
                                            <i class="fa-solid fa-play text-black"></i></div>
                                    </div>
                                    <h6 class="fw-semibold mb-1 mt-2 text-white">${info.title}</h6>
                                    <p class="mb-0 fw-medium">${info.description}</p>
                                </div>`
            } catch (error) {
                console.log(`Failed to load info.json for ${folder}, using default`);
                cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card transition-3 overflow-hidden rounded-2 p-2">
                                    <div class="img-wrapper position-relative rounded-1 overflow-hidden">
                                        <img src="/songs/${folder}/cover.jpg" class="img-fluid" alt="img">
                                        <div class="card-play opacity-0 transition-3 position-absolute rounded-circle d-flex align-items-center justify-content-center">
                                            <i class="fa-solid fa-play text-black"></i></div>
                                    </div>
                                    <h6 class="fw-semibold mb-1 mt-2 text-white">${folder}</h6>
                                    <p class="mb-0 fw-medium">Songs for you</p>
                                </div>`
            }
        }
        
        // Add click event listeners to all cards after they are created
        Array.from(document.getElementsByClassName("card")).forEach(e=>{
            e.addEventListener("click", async item =>{
                songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)
                if (songs.length > 0) {
                    playMusic(songs[0], true);
                }
            })
        })
        
    } catch (error) {
        console.log('Failed to load songs.json for albums');
    }
}

async function main(){
    // get the list of all the songs
    songs = await getSongs("songs/Hindi Songs"); 

    playMusic(songs[0], true)

    // display all the albums on the page
    displayAlbums()

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
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
    
        document.querySelector(".progress").style.width = progress + "%"; // ✅ white bar fill
        document.querySelector(".circle").style.left = progress + "%";   // ✅ circle move
    
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
        let index = songs.indexOf(currentSong.src.split("/").slice(-1) [0])
        if ((index-1) >= 0) {
            playMusic(songs[index-1])
        }
    })

    // add an event listener for next
    document.querySelector("#next").addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1) [0])
        if ((index+1) < songs.length) {
            playMusic(songs[index+1])
        }
    })

    // add an event listener for volume
    document.querySelector(".range").addEventListener("click", (e) => {
        currentSong.volume = parseInt(e.target.value)/100
    })
    
    // load the playlist whenever card is clicked
    // Removed duplicate card event listener from here

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
        let index = songs.indexOf(currentSong.src.split("/").slice(-1) [0])
        if ((index-1) >= 0) {
            playMusic(songs[index-1])
        }
    })

    // add an event listener for next
    document.querySelector("#next").addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1) [0])
        if ((index+1) < songs.length) {
            playMusic(songs[index+1])
        }
    })

    // add an event listener for volume
    document.querySelector(".range").addEventListener("click", (e) => {
        currentSong.volume = parseInt(e.target.value)/100
    })
    document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector("#startTime").innerHTML = `${secondsToMinuteSeconds(currentSong.currentTime)}`
        document.querySelector("#endTime").innerHTML = `${secondsToMinuteSeconds(currentSong.duration)}`

        let progress = (currentSong.currentTime / currentSong.duration) * 100;
        document.querySelector(".circle").style.left = progress + "%";
    });

    currentSong.addEventListener("timeupdate", () => {
        let progress = (currentSong.currentTime / currentSong.duration) * 100;
    
        document.querySelector(".progress").style.width = progress + "%"; // ✅ white bar fill
        document.querySelector(".circle").style.left = progress + "%";   // ✅ circle move
    
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
        let index = songs.indexOf(currentSong.src.split("/").slice(-1) [0])
        if ((index-1) >= 0) {
            playMusic(songs[index-1])
        }
    })

    // add an event listener for next
    document.querySelector("#next").addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1) [0])
        if ((index+1) < songs.length) {
            playMusic(songs[index+1])
        }
    })

    // add an event listener for volume
    document.querySelector(".range").addEventListener("click", (e) => {
        currentSong.volume = parseInt(e.target.value)/100
    })
    
    // load the playlist whenever card is clicked
    // Removed duplicate card event listener from here

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
    let index = songs.indexOf(currentSong.src.split("/").slice(-1) [0])
    if ((index-1) >= 0) {
        playMusic(songs[index-1])
    }
})

// add an event listener for next
document.querySelector("#next").addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1) [0])
    let nextIndex;
        
        if (isShuffle) {
            // Random song for shuffle
            do {
                nextIndex = Math.floor(Math.random() * songs.length);
            } while (nextIndex === index && songs.length > 1);
        } else {
            // Next song in sequence
            nextIndex = (index + 1) % songs.length;
        }
        
        playMusic(songs[nextIndex])
    })

// add an event listener for volume
document.querySelector(".range").addEventListener("click", (e) => {
    currentSong.volume = parseInt(e.target.value)/100
})
    
    // add shuffle functionality
    document.getElementById("shuffel").addEventListener("click", () => {
        isShuffle = !isShuffle;
        document.getElementById("shuffel").style.color = isShuffle ? "#1DB954" : "#b3b3b3";
    })

    // add loop functionality
    document.getElementById("loop").addEventListener("click", () => {
        isLoop = !isLoop;
        currentSong.loop = isLoop;
        document.getElementById("loop").style.color = isLoop ? "#1DB954" : "#b3b3b3";
    })
    
}
main();