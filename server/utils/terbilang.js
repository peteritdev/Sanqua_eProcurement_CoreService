function terbilang(pParam) {
    const bilangan = [
        "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh",
        "Delapan", "Sembilan", "Sepuluh", "Sebelas"
    ];
    const pecahan = ["", "Ribu", "Juta", "Miliar", "Triliun"];

    function convert(number) {
        if (number === 0) return "";
        if (number < 12) return bilangan[number];
        if (number < 20) return bilangan[number - 10] + " Belas";
        if (number < 100) {
            const sisa = number % 10;
            return bilangan[Math.floor(number / 10)] + " Puluh" +
                (sisa ? " " + convert(sisa) : "");
        }
        if (number < 1000) {
            const sisa = number % 100;
            if (Math.floor(number / 100) === 1) {
                return "Seratus" + (sisa ? " " + convert(sisa) : "");
            }
            return bilangan[Math.floor(number / 100)] + " Ratus" +
                (sisa ? " " + convert(sisa) : "");
        }

        for (let i = pecahan.length - 1; i >= 0; i--) {
            const divider = Math.pow(1000, i);
            if (number >= divider) {
                const sisa = number % divider;
                if (i === 1 && Math.floor(number / divider) === 1) {
                    return "Seribu" + (sisa ? " " + convert(sisa) : "");
                }
                return convert(Math.floor(number / divider)) + " " + pecahan[i] +
                    (sisa ? " " + convert(sisa) : "");
            }
        }
    }

    if (pParam === 0) return "Nol Rupiah";
    return convert(Math.floor(pParam)).trim() + " Rupiah";
}

module.exports = terbilang;