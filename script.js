/**
 * フィールド配列
 * 0: 空白, 1: 黒(先行) 2: 白(後攻)
 */
const field = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 2, 1, 0, 0, 0],
    [0, 0, 0, 1, 2, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
];

let kifu = []

// element取得
const filedTable = document.getElementById('field'); // 盤面
const turnMsg = document.getElementById('turnMsg'); // 手番表示部分
const err = document.getElementById('err') // エラー文言
const kifuBtn = document.getElementById('kifu') // 棋譜出力ボタン
const selectTemp = document.getElementById('selectTemp') // 定石選択ボックス
const selectTurn = document.getElementById('selectTurn') // 手番選択ボックス
const startBtn = document.getElementById('gameStart') // 対局開始ボタン

/**
 * 手番
 * true: 黒(先行), false: 白(後攻)
 */
let turn = true

/** 
 * コンピューター石打可否
 * true: cpu戦, false: 対人戦
 */
let isCpu

/**
 * field作成関数
 * 現在のfield配列からdom操作でHTMLにfieldを反映
 * 既存のHTMLのtableを削除し、新しく作成
 */
const createField = () => {
    const table = document.createElement('table');
    table.id = 'table'
    for (let i = 0; i < field.length; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < field[i].length; j++) {
            const td = document.createElement('td');
            td.id = `${i}${j}`
            let mark = ''
            if (field[i][j] === 1) mark = '●'
            else if (field[i][j] === 2) mark = '〇'
            else mark = ''
            td.innerHTML = mark
            td.onclick = function () { clickStone(this) }
            tr.appendChild(td)
        }
        table.appendChild(tr)
    }
    filedTable.appendChild(table)
}

/**
 * 対局開始処理
 */
const startGame = () => {
    // ターン選択処理
    isCpu = selectTurn.value === '2' ? false : true
    
    // 手番文言変更
    turnMsg.innerHTML = '黒の手番です'

    // 盤面表示処理
    filedTable.classList.remove('hide')
    filedTable.classList.add('field')
    // CPU先行1ターン目実行
    if (selectTurn.value === '1') {
        const tempNum = selectTemp.value // 選択定石
        const putPosition = cpuPut(turn, tempNum)
        setTimeout(function () {
            play(putPosition[0], putPosition[1])
        }, 1000)
    }
}
// 機能割り当て
startBtn.onclick = function () { startGame() }

/**
 * 盤面クリック時処理
 * field配列を更新、新しいフィールドをブラウザに反映
 * @param ele クリックした要素のelement
 */
let clickStone = (ele) => {
    // field座標取得
    const i = Number(ele.id.slice(0, 1)); // y座標
    const j = Number(ele.id.slice(1, 2)); // x座標

    const tempNum = selectTemp.value // 選択定石

    // クリックプレイヤー
    const isPutPlayer = play(j, i)
    if (!isPutPlayer) return

    console.log(isCpu)
    if (isCpu) {
        const putPosition = cpuPut(turn, tempNum)
        setTimeout(function () {
            play(putPosition[0], putPosition[1])
        }, 1000)
    }

}

/**
 * 座標指定後処理
 * @param {number} x x座標
 * @param {number} y y座標
 * @returns 石打可否
 */
const play = (x, y) => {
    // フィールド配列作成
    let isReverse = false
    if (field[y][x] === 0) isReverse = reverse(y, x)

    if (isReverse) {
        // フィールド反映
        const table = document.getElementById('table') // element取得
        table.remove(); // 旧盤面消去
        createField(); // 新盤面作成
        kifu.push([x, y])

        // 手番変更
        turn = !turn
        const msg = turn ? '黒の手番です' : '白の手番です'
        turnMsg.innerHTML = msg
        err.innerHTML = ''
    } else {
        err.innerHTML = 'そこにはおけません'
    }

    // field集計
    const isFill = !(field.flat().filter(n => n === 0).length) // 
    const isAllDie = (field.flat().filter(n => n === 1).length === 0)
        || (field.flat().filter(n => n === 2).length === 0) // 全滅

    // 全埋めもしくは全滅
    if (isFill || isAllDie) {
        const finMsg = GameSet()
        const finTitle = '対局終了'
        turnMsg.innerHTML = finTitle
        err.innerHTML = finMsg

        console.log('owari')
        return false
    }

    const canPutAry = canPutStone(turn)
    // スキップ必要時処理
    if (!(canPutAry.length)) {
        // 手番変更
        turn = !turn
        const msg = turn ? '黒の手番です' : '白の手番です'
        turnMsg.innerHTML = msg
        err.innerHTML = 'スキップしました'
        if (isCpu) {
            console.log('skip')
            const putPosition = cpuPut(turn, 10)
            setTimeout(function () {
                play(putPosition[0], putPosition[1])
            }, 1000)
        }
    }
    return isReverse
}

/** 
 * 裏返し判定
 * field配列から対象座標の裏返し判定、field配列に反映
 * @param i y座標
 * @param j x座標
 * @return true: フィールド変更あり false: 変更なし
 */
const reverse = (currentY, currentX) => {
    // currentを入れる、そこから、１個外と２個外を算出、currentと２個外で同じ値を出す、それに挟まれている座標を変更

    // フィールド情報を格納
    const current = turn ? 1 : 2 // クリックされた座標の値 1: 黒(先行) 2: 白(後攻)

    // 反転座標検索
    const reversePosition = search(currentX, currentY, current)

    if (reversePosition.length) {
        // 反転実行
        for (p of reversePosition) {
            field[p[0]][p[1]] = current
        }

        // クリック座標のfield配列更新
        field[currentY][currentX] = current;
        return true
    }
    return false
}

/**
 * 石打可能座標配列作成関数
 * @param {number} turn 判定するターン
 * @returns 石打可能座標配列
 */
const canPutStone = (turn) => {
    const stoneColor = turn ? 1 : 2
    // 石打可能座標配列
    const canPut = []
    // 0の位置座標配列
    const zeroPosition = []

    // 0を配列化
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            // (x, y) = (j, i)
            if (field[i][j] === 0) zeroPosition.push([j, i])
        }
    }

    // 石打可能座標配列作成
    for (s of zeroPosition) {
        const reverseAry = search(s[0], s[1], stoneColor)
        if (reverseAry.length) canPut.push([s[0], s[1]])
    }
    return canPut
}

/**
 * 範囲内判定関数
 * @param {number} x x座標 
 * @param {number} y y座標
 * @returns 
 */
const isRange = (x, y) => {
    return x >= 0 && x < 8 && y >= 0 && y < 8
}

/**
 * 反転座標配列化
 * 0かcurrentと同じ値になるまでforを回す。0か範囲外だったら何もしない、currentと同じ値だったらその間の座標を配列に追加
 * @param {number} currentX クリックx座標
 * @param {number} currentY クリックy座標
 * @param {number} currentColor 石の色 黒: 1, 白: 2, 両方: 3
 * @returns 反転座標配列
 */
const search = (currentX, currentY, currentColor) => {
    // 反転座標配列
    const reversePosition = []
    // 方向指定配列 [x, y]
    const positions = [
        [0, -1], // 上
        [0, 1], // 下
        [1, 0], // 右
        [-1, 0], // 左
        [1, -1], // 右上
        [1, 1], // 右下
        [-1, -1], // 左上
        [-1, 1], // 左下
    ]

    // 反転座標配列化処理
    for (const p of positions) {
        iloop:
        for (let i = 1; i < 8; i++) {
            // 座標算出
            const x = currentX + i * p[0] // x座標
            const y = currentY + i * p[1] // y座標

            //範囲外判定
            if (!isRange(x, y)) break

            // 検索座標の盤面情報
            const sellsUP = field[y][x]

            // 0が来たら繰り返し終了
            if (sellsUP === 0) {
                break
            }
            // 手番と同じ石が来たとき
            else if (sellsUP === currentColor) {
                // 反転探索
                for (let j = i - 1; j > 0; j--) {
                    // 座標算出
                    const x = currentX + j * p[0] // x座標
                    const y = currentY + j * p[1] // y座標

                    // 同じ色の石が来たら繰り返し終了
                    if (field[y][x] === currentColor) {
                        // 次の方向を検索
                        break iloop;
                    }

                    // 反転可否フラグ更新
                    isReverse = true
                    // 反転座標配列更新
                    reversePosition.push([y, x])
                }
                break
            }
        }
    }
    return reversePosition
}

/** 
 * ゲーム終了時処理
 * dom操作で勝敗に関する文を表示、クリックイベントを削除し操作をできないようにする
 */
const GameSet = () => {
    // 勝敗判定
    const black = field.flat().filter(n => n === 1).length
    const white = field.flat().filter(n => n === 2).length
    let finMsg = ''
    if (black > white) {
        finMsg = `黒の勝ちです 黒: ${black}, 白: ${white}`
    } else if (black < white) {
        finMsg = `白の勝ちです 黒: ${black}, 白: ${white}`
    } else {
        finMsg = `引き分けです 黒: ${black}, 白: ${white}`
    }

    // クリックイベント消去
    clickStone = () => { }
    return finMsg
}

/**
 * 棋譜出力
 * コンソールに棋譜を出力
 */
const consoleKifu = () => {
    console.log(kifu)
}
kifuBtn.onclick = function () { consoleKifu() }
// 初期フィールド作成
createField()


// 定石配列 手番順に石打座標を記述 (x, y)
const rabbit = [[5, 4], [3, 5], [2, 4], [5, 3], [4, 2]] // ウサギ定石
const tiger = [[5, 4], [3, 5], [2, 2], [5, 3], [5, 5]] // トラ定石
const cow = [[5, 4], [5, 5], [4, 5], [5, 3], [4, 6]] // 牛定石
const mouse = [[5, 4], [5, 3], [4, 2], [5, 5], [3, 2]] // ネズミ定石
const tempList = [rabbit, tiger, cow, mouse, []]
let canTemp = true // 定石利用可否フラグ

/**
 * CPU石打座標算出
 * 四つ角→四つ角に隣接していない反転石数が少ない場所→隣接のなかで反転石数が少ない場所
 * @param {boolean} turn ターン true: 黒, false: 白
 * @returns cpuが石打する場所
 */
const cpuPut = (turn, tempNum) => {
    const canPutAry = canPutStone(turn)
    const stoneColor = turn ? 1 : 2
    const lessPosition = lessReturnPosition(canPutAry, stoneColor)
    // 危険座標 (x, y)
    const dangerous = [
        [1, 0], [6, 0],
        [0, 1], [1, 1], [6, 1], [7, 1],
        [0, 6], [1, 6], [6, 6], [7, 6],
        [1, 7], [6, 7]
    ]
    // 四つ角座標(x, y)
    const corner = [
        [0, 0], [7, 0], [0, 7], [7, 7]
    ]
    // 取りに行くべき座標
    const should = [
        [2, 0], [5, 0],
        [2, 1], [5, 1],
        [0, 2], [1, 2], [2, 2], [5, 2], [6, 2], [7, 2],
        [0, 5], [1, 5], [2, 5], [5, 5], [6, 5], [7, 5],
        [2, 6], [5, 6],
        [2, 7], [5, 7]
    ]

    // 危険座標を除いた石打可能座標配列
    const delDanPosition = lessPosition.filter(x => {
        for (d of dangerous) {
            if (JSON.stringify(d) === JSON.stringify(x)) {
                return false
            }
        }
        return true
    })

    // 石打可能な四つ角の配列
    const cornerPosition = lessPosition.filter(x => {
        for (c of corner) {
            if (JSON.stringify(c) === JSON.stringify(x)) {
                return true
            }
        }
        return false
    })

    // 石打可能な打つべき座標の配列
    const shouldPosition = lessPosition.filter(x => {
        for (s of should) {
            if (JSON.stringify(s) === JSON.stringify(x)) {
                return true
            }
        }
        return false
    })

    let cpuPutPosition
    if (cornerPosition.length) {
        cpuPutPosition = cornerPosition[0]
    } else if (shouldPosition.length) {
        cpuPutPosition = shouldPosition[0]
    } else if (delDanPosition.length) {
        cpuPutPosition = delDanPosition[0]
    } else {
        cpuPutPosition = lessPosition[0]
    }
    // CPUのアルゴリズムはここに書く
    // 棋譜と定石をマッチング
    if (canTemp) {
        // 棋譜の長さと同じ長さにした定石を棋譜と比べて同じなら定石の次打つべき座標を返す
        // 変数算出
        const len = kifu.length // 棋譜の長さ
        const temp = tempList[tempNum]
        const rab = JSON.stringify(temp.slice(0, len)) // 棋譜長の定石
        const k = JSON.stringify(kifu) // 棋譜をjsonに変換

        // 定石→四つ角→打つべき→危険回避→危険有
        // 定石以外は反転石数が一番少ないものを選ぶ
        if (rab === k && rabbit[len]) {
            // 棋譜通り
            console.log('棋譜通り')
            return rabbit[len]
        } else {
            // 棋譜と違う
            canTemp = false // 定石利用可否フラグ更新
            return cpuPutPosition
        }
    }
    return cpuPutPosition
}

/**
 * 石打可能座標配列を受け取り、その中で反転座標数が一番低い座標を返す
 * @param canPutAry 石打可能座標配列
 * @param stoneColor 1: 黒(先行), 2: 白(後攻)
 * @returns 反転座標数が一番低い座標
 */
const lessReturnPosition = (canPutAry, stoneColor) => {
    const lessP = [] // 現時点での最小座標(x, y)
    for (p of canPutAry) {
        const nowReturn = search(p[0], p[1], stoneColor)
        lessP.push({ revLen: nowReturn.length, positions: [p[0], p[1]] })
    }
    lessP.sort((first, second) => {
        return first.revLen - second.revLen
    })
    const returnAry = lessP.map(x => [x.positions[0], x.positions[1]])
    return returnAry
}