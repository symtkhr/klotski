

/* 盤面を出力 */
var printb = function(b, scale)
{
    if (typeof(scale) == "undefined") scale = 10;
    if (scale == 0) {
        var ret = "";
        for (var i=0; i<5; i++) ret += b.substr(i * 4, 4) + "\n";
        return (ret);
    }
    
    var ret = '<div class="board">';
    b.split("").forEach(function(c,pos) {
        if (c == "_" || c== " ") return;
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
        ret += '<div class="piece" style="' + style.join(";") + '"></div>';
    });

    return ret + "</div>";
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

    var c = b.substr(pos, 1);
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

var Solver = function (board) {
    
    /* 比較用の盤面を生成 */
    var make_board_for_compare = function(b)
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
    var check_append = function(x)
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
        $("#solve").prop("disabled", false);
        $("#dbb").html("【検索結果】<div>(" + x.count + "手)</div>");
        while (x.parent != null) {
            var b = dbb[x.id];
            $("#dbb div:first").before("<div class='step'>" + printb(b) + "</div>");
            var id = x.parent;
            x = db[id];
        }
        exit(0);
    };

    // st内ブロックを動かしてできる新盤面をリストに追加する
    var move_all_blocks = function(st)
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
                    $("#dbb").html("solution not found");
                    return;
                }
            }
            $("#dbb").append(count +" steps, " + i + " patterns<br/>");
        
            setTimeout(function() {
                    stepwise_search();
                }, 10);
        };
        stepwise_search();
    };
};

$(function()
{
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
        $piece = $(this);
        var y = parseInt($piece.css("top"));
        var x = parseInt($piece.css("left"));
        var w = parseInt($piece.css("width"));
        var h = parseInt($piece.css("height"));
        var st = {b:board, count:0};
        var pos = (x + y * 4) / 50;

        var $dir = $piece.find(".selected");

        var dir = [];
        if($dir.hasClass("u")) dir = [0, -1];
        if($dir.hasClass("d")) dir = [0, 1];
        if($dir.hasClass("l")) dir = [-1, 0];
        if($dir.hasClass("r")) dir = [1, 0];
        var tmp = dir_block(st, pos, dir);

        if (tmp == null) {
            console.log("no"); return;
        }
        board = tmp.b;
        $("#inplay").html(printb(board, 50));
        addclickevents();
        $("#menu").hide();
    };


    var addclickevents = function() {
        //console.log(board);
        var st = {b:board, count:0};

        var ret = '<div class="l">←</div><div class="r">→</div>'
                + '<div class="u">↑</div><div class="d">↓</div>';
        
        $("#inplay .piece").each(function(idx) {
            var y = parseInt($(this).css("top"));
            var x = parseInt($(this).css("left"));
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

            $(this).append(ret).hover(null, function(){ $(this).children("div").hide(); }).click(clickmove);
            //1方向のみ
            if (movable.length == 1) {
                $(this).mousemove(function() {
                        $(this).find("." + movable[0]).show().addClass("selected");
                    });
                return;
            }
            //2方向に動かせる場合
            var w = $(this).width();
            var h = $(this).height();
            var avil = movable.join("");

            if (avil == "dr")
                var direction = function(x, y) {
                    return ((x/w < y/h) ? ".d" : ".r");
                };

            if (avil == "ul")
                var direction = function(x, y) {
                    return ((x/w < y/h) ? ".l" : ".u");
                };

            if (avil == "ur")
                var direction = function(x, y) {
                    return ((x/w + y/h < 1) ? ".u" : ".r");
                };

            if (avil == "dl")
                var direction = function(x, y) {
                    return ((x/w + y/h < 1) ? ".l" : ".d");
                };

            if (avil == "lr")
                var direction = function(x, y) {
                    return ((x < w/2) ? ".l" : ".r");
                };

            if (avil == "ud")
                var direction = function(x, y) {
                    return ((y < h/2) ? ".u" : ".d");
                };

            $(this).mousemove(function(e) {
                var offset = $(this).offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;

                $(this).find("." + movable[0] + ", ." + movable[1]).show().removeClass("selected");
                $(this).find(direction(x, y)).addClass("selected");
            });
        });
    };

    var load_quiz = function(qid) {
        board = qs[qid];
        $("#menu, #dbb").hide();
        $("#dispmenu").show();
        $("#inplay").show().html(printb(board, 50));
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
        $("#solve").show().unbind().click(function(e) {
            $("#dbb").show().html("【検索中】");
            $(this).prop("disabled", true);
            var cal = new Solver(board);
            cal.start_search();
        });
    };

    var show_menu = function() {
        $("#menu").html("【問題一覧】");
        qs.forEach(function(b) {
           $("#menu").append("<div class='option'>");
           $("#menu div:last").append(printb(b));
        });
        $("#menu").append("<hr>");
        $("#menu .option").click(function() {
             var n = $("#menu .option").index($(this));
             load_quiz(n);
        });
        $("#dispmenu").hide().unbind().click(function() {
            $("#menu").show();
        });
        $("#solve").hide();
    };

    show_menu();

    $("#sank").hover(function() {console.log("sank")});
    //$("#sikak").click(function() {console.log("sikak")});

});

