// 盤面一覧
const qboards = [
    "34 3"+"    "+"3113"+" 11 "+"1__1",
    "14 1"+"1  1"+"2 2 "+"2 2 "+"1__1",
    "34 3"+"    "+"1111"+"2 2 "+"1__1",
    "34 3"+"    "+"32 3"+" 11 "+"1__1",
    "14 1"+"3  3"+" 11 "+"32 3"+" __ ",
    //"3333"+"    "+"2 4 "+"11  "+"1__1",
    "34 3"+"    "+"2 2 "+"12 1"+"1__1",
    "12 1"+"34 3"+"    "+"1__1"+"2 2 ",
    "14 1"+"3  3"+" _3 "+"1_ 1"+"2 2 ",
    "333_"+"   _"+"1111"+"2 4 "+"2   ",
];

// pos番目のピースをdir方向に動かす
const move_piece = (board, pos, dir) => {
    const to = {
        u: [0, -1],
        d: [0, 1],
        l: [-1, 0],
        r: [1, 0],
    }[dir];
    if (!to) return;
    
    const dirx = to[0];
    const diry = to[1];
    let b = board.split("");
    const c = b[pos];
    
    //ピースの場所
    let x0 = pos % 4;
    let y0 = parseInt(pos / 4);
    
    let size = {
        1: {w:1, h:1},
        2: {w:2, h:1},
        3: {w:1, h:2},
        4: {w:2, h:2},
    }[c];

    if (!size) return;
    let h = size.h;
    let w = size.w;

    //移動方向が壁
    if ((x0 + dirx < 0) || (4 <= x0 + dirx + w - 1)) return null;
    if ((y0 + diry < 0) || (5 <= y0 + diry + h - 1)) return null;

    //ピースを空きマスにする
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
            b[(x0 + i) + (y0 + j) * 4] = "_";
        }
    }

    //空いていれば移動
    for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) {
            let pos = (x0 + i + dirx) + (y0 + j + diry) * 4;
            if (b[pos] != "_") return null;
            b[pos] = (i == 0 && j == 0) ? c : " "
        }
    }

    return b.join("");

    return {
        count: (st.count + 1),
        b: b.join(""),
        pos: [x0, y0],
        dir: dir
    };
};

let Solver = function (initboard) {
    let _this = {
        done: false,
        result: [],
        db: [{count:0, parent:null, b:initboard}], // 盤面記録
        stepboards: [[initboard]],  // idx手後の盤面
    };

    // 記録済みの盤面を動かしてできる新盤面を作る
    const move_all_blocks = function(id)
    {
        _this.db[id].b.split("").forEach((p, pos) => {
            if (_this.done || p == " " || p == "_") return;

            "udlr".split("").map(dir => {
                let b = move_piece(_this.db[id].b, pos, dir);
                if (b) append(b, id);
            });
        });
    };

    // 盤面が未知ならDBに追加
    const append = function(b, parent)
    {
        let step = _this.db[parent].count + 1;

        // 2手前まで重複チェック
        if (!_this.stepboards[step]) _this.stepboards[step] = [];
        if (_this.stepboards.slice(-3).some(dbs0 => dbs0.indexOf(b) != -1)) return;

        // 保存
        _this.db.push({b:b, count: step, parent:parent});
        _this.stepboards[step].push(b);

        if (b[3 * 4 + 1] == '4') goal();
    };

    // ゴール
    const goal = function()
    {
        _this.done = true;
        let x = _this.db.pop();
        let ret = [];
        while (x.parent != null) {
            ret.push(x.b);
            x = _this.db[x.parent];
        }
        _this.result = ret.reverse();
    };

    // 1000データずつ処理
    this.run = function(callback) {
        let pattern = 0;
        _this.done = false;

        const stepwise_search = function() {
            for (var i = 0; i < 1000; i++) {
                let checkid = pattern + i;
                move_all_blocks(checkid);

                if (_this.done) {
                    return callback.success(_this.result);
                }
                if (_this.db.length - 1 <= checkid) {
                    return callback.fail();
                }
            }
            pattern += i;
            callback.process(_this.db.slice(-1)[0].count, _this.db.length);
            setTimeout(stepwise_search, 10);
        };
        stepwise_search();
    };
};

const $id = (id) => document.getElementById(id);
const $name = (name) => document.getElementsByName(name);
const $c = (c) => document.getElementsByClassName(c);
const $q = (query) => document.querySelectorAll(query);

window.onload = () => {
    let board;

    // 盤面を出力
    const printb = (b, scale) =>
    {
        if (typeof(scale) == "undefined") scale = 10;
        if (scale == 0) {
            return [...Array(5)].map((v,i) => b.slice(i * 4, i * 4 + 4)).join("\n");
        }
        
        return '<div class="board">' + b.split("").map((c, pos) => {
            if (c == "_" || c== " ") return "";
            //ピースの場所
            var x0 = (pos % 4) * scale;
            var y0 = parseInt(pos / 4) * scale;
            
            var size = {
                1: {w:1, h:1, c:"#58f"},
                2: {w:2, h:1, c:"#ff5"},
                3: {w:1, h:2, c:"#5f8"},
                4: {w:2, h:2, c:"#f85"},
            };
            var h = size[c].h * scale;
            var w = size[c].w * scale;
            var style = ["height:" + h + "px"];
            style.push("width:" + w + "px");
            style.push("left:" + x0 + "px");
            style.push("top:" + y0 + "px");
            style.push("background-color:" + size[c].c);

            let $div = {};
            $div.style = style.join(";");
            $div.class = "piece";
            if (scale == 50) $div.id = "p" + pos.toString(10).padStart(2, "0");

            return '<div ' + Object.keys($div).map(key => key + '="' + $div[key] + '"').join(" ") + '></div>';
        }).join("") + "</div>";
    };

    const goal = () => {
        $id("p13").innerHTML +=
            '<div style="position:absolute; width:100px; height:30px; top:30px; font-size:30px;transform:rotate(30deg);">'
            + 'CLEAR' + '</div>';
        $id("showsolve").style.display = "none";
    };
    
    const clickmove = function(e, $piece) {
        if ($piece == undefined) $piece = this;

        let pos = $piece.id.slice(1);
        let $dir = $piece.getElementsByClassName("selected")[0];
        if (!$dir) return;

        let cname = "udlr".split("").find(v => $dir.classList.contains(v));
        if (!cname) return;
        let tmp = move_piece(board, parseInt(pos, 10), cname);
        if (!tmp) { console.log(board, pos, cname); return; }

        board = tmp;
        update_board(board);
    };

    const addclickevents = function() {
        let $arrow = '<div class="l"></div><div class="r"></div>'
            + '<div class="u"></div><div class="d"></div>';
        
        [...$q("#inplay .piece")].map(($dom, idx) => {
            var y = parseInt($dom.style["top"]);
            var x = parseInt($dom.style["left"]);
            var pos = (x + y * 4) / 50;

            let movable = "udlr".split("").filter(dir => move_piece(board, pos, dir));
            if (movable.length == 0) return;

            $dom.innerHTML = $arrow;
            
            movable.map(v => {
                [...$dom.getElementsByClassName(v)].map($cdom => {
                    $cdom.style.display = "block";
                    $cdom.onclick = (e) => {
                        $cdom.classList.add("selected");
                        clickmove(e, $dom);
                    };
                });

            });

            //1方向のみ
            if (movable.length == 1) {
                $dom.onclick = (e) => {
                    $dom.getElementsByClassName(movable[0])[0].classList.add("selected");
                    clickmove(e, $dom);
                };
                return;
            }

            //2方向に動かせる場合
            var w = $dom.offsetWidth;
            var h = $dom.offsetHeight;

            let direction = {
                dr: (x, y) => ((x/w < y/h) ? "d" : "r"),
                ul: (x, y) => ((x/w < y/h) ? "l" : "u"),
                ur: (x, y) => ((x/w + y/h < 1) ? "u" : "r"),
                dl: (x, y) => ((x/w + y/h < 1) ? "l" : "d"),
                lr: (x, y) => ((x < w/2) ? "l" : "r"),
                ud: (x, y) => ((y < h/2) ? "u" : "d"),
            }[movable.join("")];

            $dom.onclick = function(e) {
                var dompos = $dom.getBoundingClientRect();
                var posX = dompos.left + window.pageXOffset;
                var posY = dompos.top + window.pageYOffset;

                var x = e.pageX - posX;
                var y = e.pageY - posY;
                $dom.getElementsByClassName(direction(x, y))[0].classList.add("selected");
                clickmove(e, $dom);
            };
        });
    };

    const update_board = (b) => {
        $id("menu").style.display = "none";
        $id("showmenu").style.display = "inline-block";
        $id("inplay").style.display = "block";
        $id("inplay").innerHTML = printb(b, 50);

        if (board[13] == "4") return goal();
        addclickevents();
    };
    
    const load_quiz = (qid) => {
        board = qboards[qid];
        $id("solve").style.display = "none";
        update_board(board);

        $id("showsolve").style.display = "inline-block";
        $id("showsolve").onclick = function(e) {
            $id("solve").style.display = "block";
            $id("solve").innerHTML = ("<h2>検索中</h2><div id=solvelog></div>");
            $id("showsolve").style.display = "";
            var cal = new Solver(board);
            cal.run({
                success: (result) => {
                    $id("showsolve").style.display = "inline-block";
                    $id("solve").innerHTML =
                        "<h2>検索結果 (" + result.length + "手)</h2><div>"
                        + result.map(b => ("<div class='step'>" + printb(b) + "</div>")).join("")
                        +"</div>";
                },
                fail: () => { $id("solve").innerHTML = ("solution not found"); },
                process: (s, p) => {
                    $id("solvelog").innerText += (s +" steps, " + p + " patterns\n");
                },
            });
        };
    };

    const show_menu = function() {
        $id("menu").innerHTML = "<h2>問題一覧</h2>";
        qboards.forEach((b,i) => {
            let $div = document.createElement("div");
            $div.classList.add("option");
            $div.innerHTML = printb(b);
            $div.onclick = () => load_quiz(i);
            $id("menu").appendChild($div);
        });

        $id("showmenu").onclick = () => {
            $id("showmenu").style.display = "none";
            $id("menu").style.display = "";
        };

    };
    show_menu();
};
