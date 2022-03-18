//最終課題　スマホで睡眠時の音の計測結果をチェック

//johnny-fiveの準備
const five = require("johnny-five");                //johnny-fiveモジュールの読み込み
const board = new five.Board( {port: "COM4"} );     //Arduinoマイコンボードの取得

//音センサの準備
let sound;                                          //音センサ用のオブジェクト
board.on("ready", () => {                           //Arduinoの準備ができたら
    sound = new five.Sensor({                       //音センサを準備
        pin: "A0",                                  //A0に接続
        freq: 1000                                  //1000ms間隔で計測
    });
});

//httpsサーバの起動
const ex = require("express");                      //expressモジュールを使う
const fs = require("fs");                           //fsモジュールを使う
const { networkInterfaces } = require("os");
//アプリの諸設定
const app = ex();                                   //expressでサーバアプリを作る
app.use(ex.static(__dirname));                      //ドキュメントルートへのアクセス許可
app.get("/", (req,res) => {                         //アクセス要求があったら
    res.sendFile(__dirname + "/index.html");        //クライアントにindex.htmlを送る
});
//httpsサーバを立てる
const opt = {                                       //httpsのオプション設定
    key:  fs.readFileSync("../ssl/server.key"),     //秘密鍵ファイルを読み込む
    cert: fs.readFileSync("../ssl/server.crt")      //証明書ファイルを読み込む
};  
const svr = require("https").Server(opt,app);       //httpsサーバを作成
svr.listen(443);                                    //433番ポートへのアクセスを監視
console.log("サーバ起動（終了はCtrl+C)");             //サーバ起動成功の表示

//WebSocketでスマホにデータ送信
const io = require("socket.io")(svr);               //socket.ioモジュールを使う
io.on("connection", (socket) => {                   //socket接続(connection)があったら
    console.log("ユーザが接続");                     //ユーザ接続時のログ表示
    if (!board.isReady) { return; }                 //Arduinoの準備がまだなら何もしない
    sound.on("data", () => {                        //音センサのデータが計測されたら
        console.log(sound.value);                   //計測値をログ表示
        io.emit("sensor", { sounds: sound.value }); //sensorという名前でセンサの値を全員に配信
    });
});
