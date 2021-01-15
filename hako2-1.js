const $id = (id) => document.getElementById(id);
const $name = (name) => document.getElementsByName(name);
const $c = (c) => document.getElementsByClassName(c);
const $q = (query) => document.querySelectorAll(query);

/* 盤面を出力 */
var printb = function(b, scale)
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

        return '<div class="piece" style="' + style.join(";") + '"></div>';

    }).join("") + "</div>";
};

// pos番目のピースをdir方向に動かす。
// 可能ならば新盤面を返す。不可能ならnullを返す。
var dir_block = function(st, pos, dir)
{
    var dirx = dir[0];
    var diry = dir[1];
    var b = st.b;
    
    //ピースの場所
    var x0 = pos % 4;
    var y0 = parseInt(pos / 4);
    
    var size = {
    1: {w:1, h:1},
    2: {w:2, h:1},
    3: {w:1, h:2},
    4: {w:2, h:2},
    };

    var c = b[pos];
    if (b[pos] == "_") return;
    var h = size[c].h;
    var w = size[c].w;

    //移動方向が壁
    if ((x0 + dirx < 0) || (x0 + dirx + w - 1 >= 4)) return null;
    if ((y0 + diry < 0) || (y0 + diry + h - 1 >= 5)) return null;

    //ピースを空きマスにする
    for (var i = 0; i < w; i++) {
        for (var j = 0; j < h; j++) {
            var pos = (x0 + i) + (y0 + j) * 4;
            b = b.substr(0, pos) + "_" + b.substr(pos + 1);
        }
    }

    //空いていれば移動
    for (var i = 0; i < w; i++) {
        for (var j = 0; j < h; j++) {
            var pos = (x0 + i + dirx) + (y0 + j + diry) * 4;
            if (b.substr(pos, 1) != "_") return null;
            var sym = (i == 0 && j == 0) ? c : " "
            b = b.substr(0, pos) + sym + b.substr(pos + 1);
        }
    }
    return {count:(st.count + 1), b:b, pos: [x0, y0], dir: dir};
}

const Solver = function (board) {
    
    /* 比較用の盤面を生成 */
    const make_board_for_compare = function(b)
    {
        //ビット配列にしてみる(3ビット*20)
        //空0 小1 横2 縦3 大4
        return b;
        var s = b.split("");
        var is_rev = false;
        /*#ifdef SYM*/
        for (var i = 0; i < 5; i++) {
            for (var j = 0; j < 2; j++) {
                var left = s[i * 4 + j];
                var right = s[i * 4 + 3 - j];
                if (left == right) continue;
                if (left > right) {
                    return s.join("");
                }
                is_rev = true;
                break;
            }
            if (is_rev) break;
        }
        /* 左右反転 */
        if (is_rev) {
            for (var i = 0; i < 5; i++) {
                for (var j = 0; j < 2; j++) {
                    var left = s[i * 4 + j];
                    s[i * 4 + j] = s[i * 4 + 3 - j];
                    s[i * 4 + 3 - j] = left;
                }
            }
            return s.join("");
        }
        return b;
        /*#endif SYM*/
    };

    // xが新盤面ならリストに追加、そうでなければ何もしない
    // xがgoalならば履歴を出力し、program終了
    const check_append = function(x)
    {
        if (x == null) return;
        
        //var b = make_board_for_compare(x.b);
        var b = x.b;
        
        // 2手前まで重複チェック
        if (dbs[x.count] == undefined) dbs[x.count] = [];
        if (dbs[x.count].indexOf(b) != -1) return;
        if (x.count - 1 >= 0 && dbs[x.count-1].indexOf(b) != -1) { return; }
        if (x.count - 2 >= 0 && dbs[x.count-2].indexOf(b) != -1) { return; }
        
        // 保存
        db.push({parent: parent, count:x.count, id:dbb.length});
        dbb.push(b);
        dbs[x.count].push(b);
        
        if (b.substr(3 * 4 + 1, 1) != '4') return;

        // ゴール
        var x = db.pop();
        $id("solve").disabled = false;
        $id("dbb").innerHTML = ("【検索結果】<div>(" + x.count + "手)</div>");
        while (x.parent != null) {
            var b = dbb[x.id];
            $q("#dbb div")[0].innerHTML += ("<div class='step'>" + printb(b) + "</div>");
            var id = x.parent;
            x = db[id];
        }
        exit(0);
    };

    // st内ブロックを動かしてできる新盤面をリストに追加する
    const move_all_blocks = function(st)
    {
        st.b = dbb[st.id];
        st.b.split("").forEach(function(p, i) {
            if (p == " " || p == "_") return;
            var tmp = dir_block(st, i, [0, -1]);
            check_append(tmp);
            var tmp = dir_block(st, i, [0, 1]);
            check_append(tmp);
            var tmp = dir_block(st, i, [-1, 0]);
            check_append(tmp);
            var tmp = dir_block(st, i, [1, 0]);
            check_append(tmp);
        });
    };

    var parent = -1;
    var dbb = [board];
    var db = [{count:0, parent:null, id:0, b:board}];
    var dbs = [dbb];

    this.start_search = function() {
        var i = 0;
        var stepwise_search = function() {
            var count = db[i].count;
            var now = i;
            for(; i < now + 1000; i++) {
                parent = i;
                move_all_blocks(db[i]);
            
                if (db.length <= i + 1) {
                    $id("dbb").innerHTML = ("solution not found");
                    return;
                }
            }
            $id("dbb").append(count +" steps, " + i + " patterns\n");
        
            setTimeout(function() {
                    stepwise_search();
                }, 10);
        };
        stepwise_search();
    };
};

window.onload = () => {
    var board;
    var qs = [
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

    
    var clickmove = function(e, $piece) {
        console.log(e);
        if ($piece == undefined)
            $piece = this;
        var y = parseInt($piece.style["top"]);
        var x = parseInt($piece.style["left"]);
        var w = parseInt($piece.style["width"]);
        var h = parseInt($piece.style["height"]);
        var st = {b:board, count:0};
        var pos = (x + y * 4) / 50;

        var $dir = $piece.getElementsByClassName("selected")[0];

        var dir = [];
        if($dir.classList.contains("u")) dir = [0, -1];
        if($dir.classList.contains("d")) dir = [0, 1];
        if($dir.classList.contains("l")) dir = [-1, 0];
        if($dir.classList.contains("r")) dir = [1, 0];
        var tmp = dir_block(st, pos, dir);

        if (tmp == null) {
            console.log("no"); return;
        }
        board = tmp.b;
        $id("inplay").innerHTML = (printb(board, 50));
        console.log(board);
        if (board[13] == "4") {
            console.log("clear");
            $id("inplay").innerHTML += '<div style="position:absolute; width:100px; height:100px; left:35px; top:180px; font-size:30px;transform:rotate(30deg);">CLEAR</div>';
            return;
        }
        addclickevents();
        $id("menu").style.display = "none";
    };


    var addclickevents = function() {
        var st = {b:board, count:0};

        var ret = '<div class="l">←</div><div class="r">→</div>'
            + '<div class="u">↑</div><div class="d">↓</div>';
        var ret = '<div class="l"></div><div class="r"></div>'
            + '<div class="u"></div><div class="d"></div>';
        
        [...$q("#inplay .piece")].map(($dom, idx) => {
            var y = parseInt($dom.style["top"]);
            var x = parseInt($dom.style["left"]);
            var pos = (x + y * 4) / 50;
            var movable = [];

            var tmp = dir_block(st, pos,[0, -1]);
            if (tmp) movable.push("u");
            var tmp = dir_block(st, pos,[0, 1]);
            if (tmp) movable.push("d");
            var tmp = dir_block(st, pos,[-1, 0]);
            if (tmp) movable.push("l");
            var tmp = dir_block(st, pos,[1, 0]);
            if (tmp) movable.push("r");

            if (movable.length == 0) return;

            $dom.innerHTML += (ret);
            
            if (movable.length == 1) {
                $dom.onclick = (e) => {
                    $dom.getElementsByClassName(movable[0])[0].classList.add("selected");
                    clickmove(e, $dom);
                };
            }
            
            if(0)
            $dom.onmousedown = (e) => {
                console.log("down");
                if (movable.length == 1) {
                    $dom.getElementsByClassName(movable[0])[0].classList.add("selected");
                    return clickmove("", $dom);
                }
                let pos0 = [e.clientX, e.clientY];
                let dom0 = [$dom.style.left, $dom.style.top];
                let drag = (e) => {
                    let pos = [e.clientX, e.clientY];
                    let diff = [pos[0] - pos0[0], pos[1] - pos0[1]];
                    //if (Math.abs(diff[0]) < 10 && Math.abs(diff[1]) < 10) return;
                    let mov = (diff[0] < 0 ? "l" : "r") + (diff[1] < 0 ? "u" : "d");
                    console.log(diff);
                    let dir = movable.filter(v => mov.indexOf(v) != -1);
                    if (dir.length == 0) return;
                    if (dir.length == 1) dir = dir[0];
                    if (dir.length == 2) {
                        dir = Math.abs(diff[0]) < Math.abs(diff[1]) ? dir[1] : dir[0]; 
                    }
                    $dom.getElementsByClassName(dir)[0].classList.add("selected");
                    console.log(dir);
                    if (dir=="u" || dir == "d") {
                        $dom.style.left = dom0[0];
                        $dom.style.top = (pos[1]) + "px";
                    }
                    if (dir=="r" || dir == "l") {
                        $dom.style.top = dom0[1];
                        $dom.style.left = (pos[0]) + "px";
                    }
                    //var width = $dom.offsetWidth;

                    //$dom.style.top = (y-height/2) + "px";
                    //$dom.style.left = (x-width/2) + "px";
                };
                document.onmousemove = (e) => {
                    var x = e.pageX - $dom.offsetLeft;
                    var y = e.pageY - $dom.offsetTop;
                    //var dir = (x,y);
                    console.log(e.clientX,e.clientY,$dom.offsetLeft, $dom.offsetTop);
                    var tmp = dir_block(st, pos, [0,-1]);
                    //console.log(tmp);
                };
                //drag;
                document.onmouseup = (e) => {
                    document.onmousemove = null;
                    document.onmouseup = null;
                    drag(e);
                    $dom.style.left = dom0[0];
                    $dom.style.top = dom0[1];
                    //console.log("up");
                    [...$dom.children].map($cdom => console.log($cdom.classList));
                    if ([...$dom.children].some($cdom => $cdom.classList.contains("selected")))
                        clickmove("", $dom);

                    //document.removeEventListener("mousemove", drag);
                };
            };
            if(1)
            movable.map(v => {
                [...$dom.getElementsByClassName(v)].map($cdom => {
                    $cdom.style.display = "block";
                    $cdom.onclick = (e) => {
                        $cdom.classList.add("selected");
                        clickmove(e, $dom);
                    };
                });

            });
            /*            return;

            //1方向のみ
            if (movable.length == 1) {
                //$dom.onmousemove = function() {
                    [...$dom.getElementsByClassName(movable[0])].map($cdom => {
                        $cdom.classList.add("selected");
                        $cdom.style.display = "block";
                    });
                //};
                //[...$dom.children].map($cdom => 
                return;
            }
            */
            if (movable.length == 1) return;

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

    const load_quiz = (qid) => {
        board = qs[qid];
        $id("menu").style.display = "none";
        $id("dbb").style.display = "none";
        $id("dispmenu").style.display = "";
        $id("inplay").style.display = "block";
        $id("inplay").innerHTML = (printb(board, 50));
        addclickevents();
        /*
        $(document).unbind().mouseup(function(e) {
                if (!is_drag) return;
                is_drag = false;
                var cx = e.pageX - edown.pageX;
                var cy = e.pageY - edown.pageY;

                var dir = [];
                if (Math.abs(cx) < Math.abs(cy)) {
                    dir = [0, (cy < 0) ? -1 : 1];
                } else {
                    dir = [(cx < 0) ? -1 : 1, 0];
                }

                clickmove(dir, $piece);
            });
        */
        $id("solve").style.display = "";
        $id("solve").onclick = function(e) {
            $id("dbb").style.display = "";
            $id("dbb").innerHTML = ("【検索中】");
            $id("solve").disabled = true;
            var cal = new Solver(board);
            cal.start_search();
        };
    };

    var show_menu = function() {
        $id("menu").innerHTML = ("【問題一覧】");
        qs.forEach((b) => {
            let $div = document.createElement("div");
            $div.classList.add("option");
            $div.innerHTML = printb(b);
            $id("menu").appendChild($div);
        });
        $id("menu").innerHTML += ("<hr>");
        [...$q("#menu .option")].map(($dom, i) => $dom.onclick = () => load_quiz(i));
        $id("dispmenu").style.display = "none";
        $id("dispmenu").onclick = () => { $id("menu").style.display = ""};
        $id("solve").style.display = "none";
    };

    show_menu();

    //$id("sank").onhover = (function() {console.log("sank")});
    //$id("sikak").click(function() {console.log("sikak")});

};

