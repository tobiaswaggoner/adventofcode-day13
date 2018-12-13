var fs = require('fs');

// Read, prepare and execute puzzle 
fs.readFile('puzzleinput.txt', 'utf8', function (err, puzzle) {
    const track = prepare(puzzle);
    execute(track);
});

// move all carts to an array and remove them from the map
function prepare(puzzle) {

    const track = {
        puzzle: puzzle.split('\r\n').map(r => r.split('')),
        carts: [],
        tick: 0,
        finished: false,
    }

    var nxtCartId = 0;

    track.carts = track.puzzle.reduce((allCarts, puzzleRow, y) => {

        return puzzleRow.reduce((newCarts, value, x) => {

            if ("<>v^".indexOf(value) > -1) {

                // Remove cart from track
                track.puzzle[y][x] =  "<>".indexOf(value > -1) ? "-" : "|";

                newCarts.push({
                    id: nxtCartId++,
                    posX: x,
                    posY: y,
                    deltaX: value == "<" ? -1 : (value == ">" ? 1 : 0),
                    deltaY: value == "^" ? -1 : (value == "v" ? 1 : 0),
                    nextTurn: 0
                });
            }

            return newCarts;

        }, allCarts);


    }, []);

    return track;
}

// per tick: move and validate until finished or limit reached
function execute(track) {
    console.log("Starting with " + track.carts.length + " carts");

    while (track.tick < 1000000 && !track.finished) {

        track.tick++;
        move(track);

        // End Condition
        if (track.carts.length == 1) {
            console.log("Last cart: " + track.carts[0].id + " / " + track.carts[0].posX + "/" + track.carts[0].posY);
            track.finished = true;
        }
    
    }
}

//Move and turn all carts
function move(track) {

    // Sort / Move order
    track.carts.sort((a, b) => (a.posY == b.posY) ? (a.posX - b.posX) : (a.posY - b.posY))

    track.carts.forEach(cart => {

        cart.posX += cart.deltaX;
        cart.posY += cart.deltaY;

        if (cart.posX < 0 || cart.posY < 0 || cart.posX > track.puzzle[0].length -1 || cart.posY > track.puzzle.length -1 ) 
            throw new Error("Cart left map");

        // check for crashes after EACH cart movement!
        validate(track);
        if(track.finished) return;

        const road = track.puzzle[cart.posY][cart.posX];
        if (road == " ") 
            throw new Error("Cart left track:" + JSON.stringify(cart));

        // curve?
        if("\\/".indexOf( road) >-1 ) {
            let newDeltaX = cart.deltaX!=0 ? 0 : ( road == "\\" ? cart.deltaY : -cart.deltaY);
            cart.deltaY = cart.deltaY!=0 ? 0 : ( road == "\\" ? cart.deltaX : -cart.deltaX);
            cart.deltaX=newDeltaX;
        }

        // crossroads?
        if(road == '+'){
            // 0=left, 1 = straight, 2 = right
            if (cart.nextTurn != 1) {
                let newDeltaX = cart.deltaX!=0 ? 0 : ( cart.nextTurn == 0 ? cart.deltaY : -cart.deltaY);
                cart.deltaY = cart.deltaY!=0 ? 0 : ( cart.nextTurn == 0 ? -cart.deltaX : cart.deltaX);
                cart.deltaX=newDeltaX;
            }
            cart.nextTurn = cart.nextTurn == 2 ? 0 : cart.nextTurn + 1;
        }
    });

}

// Check for crashes and remove crashed carts.
function validate(track){

    const crashedCarts = track.carts.reduce( (result, cart1) => {
        if (track.carts.find(cart2 => cart1.id != cart2.id && cart1.posX == cart2.posX && cart1.posY == cart2.posY)) {
            return result.concat([cart1.id]);
        } else {
            return result;
        }
    }, []);

    if (crashedCarts.length > 0) {
        track.carts = track.carts.filter(c => crashedCarts.indexOf(c.id)==-1);
        console.log("Removed " + JSON.stringify(crashedCarts) + " / " + track.carts.length + " carts left");
    }

    if (track.carts.length == 0) {
        throw new Error("Damn - No cart left");
    }

}
