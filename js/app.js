const colorThief = new ColorThief();
var image = document.getElementById('cover');
image.crossOrigin = 'anonymous';
function noop() { }
// Make sure image is finished loading
image.addEventListener('load', function () {
    console.log(colorThief.getColor(image));
    $('body').css("background", "linear-gradient(0deg, rgb(18,18,18) 0%, rgb(24,24,24) 40%, rgb(" + colorThief.getColor(image) + ") 100%)")
    // $(".center-image img").css("box-shadow", "0px 0px 4px 4px rgb("+colorThief.getColor(image)+")")
});
var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
var client_id = "c1f03a9f4f2a4a3aacb76c2d347cafea";
if (window.origin == "http://localhost:9009") {
    redirect_uri = "http://localhost:9009/callback.html"
} else {
    var redirect_uri = 'https://anthony6444.github.io/slwall/callback.html';
}
var state = generateRandomString(16);
enableLyrics = false;

localStorage.setItem('state', state);
var scope = 'user-read-private user-read-email user-read-playback-state user-read-currently-playing user-read-playback-position';
var lyrics = [{ seconds: 1, lyrics: "" }];
var lyricnum = 0;
var extra = 0;
var interval = setInterval(noop(), 1000);
var extrarefresh = setInterval(function () {
    getplaying();
}, 4000)

if (localStorage.getItem("token") != null) {
    token = localStorage.getItem('token')
} else {
    token = null;
    login();
}
function getplaying() {
    if (token) {
        $.ajax({
            url: 'https://api.spotify.com/v1/me/player/currently-playing',
            headers: {
                "Authorization": "Bearer " + token
            },
            statusCode: {
                401: function () {
                    console.log("Logging in...");
                    login();
                }
            },
            success: function (res) {
                oldt = track;
                olda = artist;
                oldc = cover;
                track = res['item']['name'];
                artist = res['item']['album']['artists'][0]['name'];
                cover = res['item']['album']['images'][0]['url'];
                seconds = res['progress_ms'] / 1000
                duration = res['item']['duration_ms'] / 1000
                document.getElementById("track").innerHTML = track;
                document.getElementById('artist').innerHTML = artist;
                if (oldc != cover) {
                    document.getElementById("cover").src = cover;
                }
                if (oldt != track && olda != artist) {
                    getlyrics(track, artist, seconds, duration);
                    extra = 0;
                }
            }
        });
    }
}
getplaying();
function getlyrics(track, artist) {
    var url = "https://strawberry-cupcake-01939.herokuapp.com/https://api.textyl.co/api/lyrics";
    url += "?q=" + encodeURIComponent(artist) + "%20" + encodeURIComponent(track);
    $.ajax({
        url: url,
        headers: {
            "Accept": "application/json"
        },
        statusCode: {
            404: function () {
                // on fail
                lyrics = [{ seconds: 1, lyrics: "" }]
            }
        },
        success: function (res) {
            lyrics = res;
            console.log(lyrics)
            if (enableLyrics) {
                $('.lyrics').append('<span class="tx lyrics-line" id="lyrics">' + lyrics[0]['lyrics'] + '</span>')
            } else {
                $('.lyrics').append('<span class="tx lyrics-line" id="lyrics"></span>')
            }
        }
    });
    clearInterval(interval);
    interval = setInterval(updatetime, 500, seconds, duration);
}
function updatetime(seconds, duration) {
    percent = ((seconds + extra) / duration) * 100;
    $('#bar').css("width", percent * 8 + "px")
    if (percent > 100) { getplaying(); extra = 0 }
    $("#elapsed").text(Math.floor((seconds + extra) / 60) + ":" + String(Math.floor((seconds + extra) % 60)).padStart(2, "0"));
    $("#duration").text(Math.floor(duration / 60) + ":" + String(Math.floor(duration % 60)).padStart(2, "0"));
    if (enableLyrics) {
        lyric(seconds + extra);
    } else {
        $('.lyrics span').html("");
    }
    extra += .5;
}
function lyric(seconds) {
    seconds = Math.floor(seconds - 0.5)
    console.log(seconds)
    for (k = 0; k < lyrics.length; k++) {
        if (lyrics[k]["seconds"] > seconds) {
            $('.lyrics span').html(lyrics[k]['lyrics']);
            return;
        }
    }
}

function login() {
    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(client_id);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
    url += '&state=' + encodeURIComponent(state);
    document.location = url;
}
