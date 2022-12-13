let a = [1, 2];
let b = [3, 4];
let c = [-1, 3];
let d = [5, 7];

function goc2(a, b, c) {
    let l = Math.sqrt(
        (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])
    );
    newX = ((c[0] - a[0]) * (b[0] - a[0]) + (c[1] - a[1]) * (b[1] - a[1])) / l;
    newY = ((c[1] - a[1]) * (b[0] - a[0]) - (c[0] - a[0]) * (b[1] - a[1])) / l;
    if (newY > 0) return "Rẽ trái";
    else return "Rẽ phải";
}

function goc(a, b, c) {
    let vAB = [b[0] - a[0], b[1] - a[1]];
    let vBC = [c[0] - b[0], c[1] - b[1]];
    let cosV =
        (vAB[0] * vBC[0] + vAB[1] * vBC[1]) /
        (Math.sqrt(vAB[0] * vAB[0] + vAB[1] * vAB[1]) *
            Math.sqrt(vBC[0] * vBC[0] + vBC[1] * vBC[1]));
    let deg = Math.acos(cosV);
    return (deg * 180) / Math.PI;
}

console.log(goc(b, c, a));
if (goc(b, c, a) > 20) {
    console.log(goc2(b, c, a));
} else {
    console.log("Đi thẳng");
}
// console.log(goc2(b, c, a));
// console.log(goc(b, c, a));

// https://stackoverflow.com/questions/1560492/how-to-tell-whether-a-point-is-to-the-right-or-left-side-of-a-line

// answered Dec 27, 2020 at 19:12
// P.Tsiros
