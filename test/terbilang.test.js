const _xTerbilang = require('../server/utils/terbilang');

describe('Unit Test Terbilang Rupiah', () => {

    test('111 → Seratus Sebelas', () => {
        expect(_xTerbilang(111))
            .toBe('Seratus Sebelas Rupiah');
    });

    test('113111 → Seratus Tiga Belas Ribu Seratus Sebelas', () => {
        expect(_xTerbilang(113111))
            .toBe('Seratus Tiga Belas Ribu Seratus Sebelas Rupiah');
    });

    test('1111 → Seribu Seratus Sebelas', () => {
        expect(_xTerbilang(1111))
            .toBe('Seribu Seratus Sebelas Rupiah');
    });

    test('1111111 → Satu Juta Seratus Sebelas Ribu Seratus Sebelas', () => {
        expect(_xTerbilang(1111111))
            .toBe('Satu Juta Seratus Sebelas Ribu Seratus Sebelas Rupiah');
    });

    test('1000 → Seribu', () => {
        expect(_xTerbilang(1000))
            .toBe('Seribu Rupiah');
    });

});
