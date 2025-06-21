const products = {
    freeFireMax: [
        { id: "ffm_5dm", name: "5 DM", price: 2005, icon: "fa-gamepad" },
        { id: "ffm_10dm", name: "10 DM", price: 2791, icon: "fa-gamepad" },
        { id: "ffm_12dm", name: "12 DM", price: 3081, icon: "fa-gamepad" },
        { id: "ffm_16dm", name: "16 DM", price: 3674, icon: "fa-gamepad" },
        { id: "ffm_18dm", name: "18 DM", price: 3964, icon: "fa-gamepad" },
        { id: "ffm_20dm", name: "20 DM", price: 4254, icon: "fa-gamepad" },
        { id: "ffm_23dm", name: "23 DM", price: 4844, icon: "fa-gamepad" },
        { id: "ffm_27dm", name: "27 DM", price: 5429, icon: "fa-gamepad" },
        { id: "ffm_31dm", name: "31 DM", price: 6519, icon: "fa-gamepad" },
        { id: "ffm_36dm", name: "36 DM", price: 7109, icon: "fa-gamepad" },
        { id: "ffm_45dm", name: "45 DM", price: 8289, icon: "fa-gamepad" },
        { id: "ffm_56dm", name: "56 DM", price: 9468, icon: "fa-gamepad" },
        { id: "ffm_70dm", name: "70 DM", price: 11028, icon: "fa-gamepad" },
        { id: "ffm_86dm", name: "86 DM", price: 12587, icon: "fa-gamepad" },
        { id: "ffm_100dm", name: "100 DM", price: 14146, icon: "fa-gamepad" },
        { id: "ffm_120dm", name: "120 DM", price: 16316, icon: "fa-gamepad" },
        { id: "ffm_140dm", name: "140 DM", price: 18486, icon: "fa-gamepad" },
        { id: "ffm_150dm", name: "150 DM", price: 19571, icon: "fa-gamepad" },
        { id: "ffm_160dm", name: "160 DM", price: 20656, icon: "fa-gamepad" },
        { id: "ffm_200dm", name: "200 DM", price: 25526, icon: "fa-gamepad" },
        { id: "ffm_210dm", name: "210 DM", price: 26616, icon: "fa-gamepad" },
        { id: "ffm_218dm", name: "218 DM", price: 27146, icon: "fa-gamepad" },
        { id: "ffm_230dm", name: "230 DM", price: 29595, icon: "fa-gamepad" },
        { id: "ffm_240dm", name: "240 DM", price: 30685, icon: "fa-gamepad" },
        { id: "ffm_250dm", name: "250 DM", price: 31770, icon: "fa-gamepad" },
        { id: "ffm_280dm", name: "280 DM", price: 34834, icon: "fa-gamepad" },
        { id: "ffm_355dm", name: "355 DM", price: 42703, icon: "fa-gamepad" },
        { id: "ffm_420dm", name: "420 DM", price: 49372, icon: "fa-gamepad" },
        { id: "ffm_500dm", name: "500 DM", price: 58537, icon: "fa-gamepad" },
        { id: "ffm_600dm", name: "600 DM", price: 69166, icon: "fa-gamepad" },
        { id: "ffm_720dm", name: "720 DM", price: 80648, icon: "fa-gamepad" },
        { id: "ffm_860dm", name: "860 DM", price: 94827, icon: "fa-gamepad" },
        { id: "ffm_950dm", name: "950 DM", price: 104502, icon: "fa-gamepad" },
        { id: "ffm_1000dm", name: "1000 DM", price: 109091, icon: "fa-gamepad" },
        { id: "ffm_1035dm", name: "1035 DM", price: 112421, icon: "fa-gamepad" },
        { id: "ffm_1080dm", name: "1080 DM", price: 116756, icon: "fa-gamepad" },
        { id: "ffm_1450dm", name: "1450 DM", price: 150446, icon: "fa-gamepad" },
        { id: "ffm_2180dm", name: "2180 DM", price: 220693, icon: "fa-gamepad" },
        { id: "ffm_2720dm", name: "2720 DM", price: 272893, icon: "fa-gamepad" },
        { id: "ffm_3640dm", name: "3640 DM", price: 357083, icon: "fa-gamepad" },
        { id: "ffm_7290dm", name: "7290 DM", price: 704839, icon: "fa-gamepad" },
        { id: "ffm_7500dm", name: "7500 DM", price: 724889, icon: "fa-gamepad" },
    ],
    levelUpPassFFMax: [
        { id: "lup_ffm_lv6", name: "Lv.6 (FF MAX)", price: 8581, icon: "fa-ticket-alt" },
        { id: "lup_ffm_lv8", name: "Lv.8 (FF MAX)", price: 10169, icon: "fa-ticket-alt" },
        { id: "lup_ffm_lv10", name: "Lv.10 (FF MAX)", price: 11752, icon: "fa-ticket-alt" },
        { id: "lup_ffm_lv15", name: "Lv.15 (FF MAX)", price: 16927, icon: "fa-ticket-alt" },
        { id: "lup_ffm_lv20", name: "Lv.20 (FF MAX)", price: 22602, icon: "fa-ticket-alt" },
        { id: "lup_ffm_lv25", name: "Lv.25 (FF MAX)", price: 27777, icon: "fa-ticket-alt" },
        { id: "lup_ffm_lv30", name: "Lv.30 (FF MAX)", price: 32952, icon: "fa-ticket-alt" },
    ],
    lainnyaFFMax: [
        { id: "other_ffm_bpcard", name: "BP Card (FF MAX)", price: 47198, icon: "fa-coins" },
        { id: "other_ffm_memweek", name: "Membership Mingguan (FF MAX)", price: 26001, icon: "fa-coins" },
        { id: "other_ffm_memmonth", name: "Membership Bulanan (FF MAX)", price: 83689, icon: "fa-coins" },
    ],
    freeFireRegular: [
        { id: "ffr_5dm", name: "5 DM (Reguler)", price: 1800, icon: "fa-gamepad" },
        { id: "ffr_12dm", name: "12 DM (Reguler)", price: 2800, icon: "fa-gamepad" },
        { id: "ffr_50dm", name: "50 DM (Reguler)", price: 8800, icon: "fa-gamepad" },
        { id: "ffr_70dm", name: "70 DM (Reguler)", price: 10500, icon: "fa-gamepad" },
        { id: "ffr_100dm", name: "100 DM (Reguler)", price: 13300, icon: "fa-gamepad" },
        { id: "ffr_140dm", name: "140 DM (Reguler)", price: 16500, icon: "fa-gamepad" },
        { id: "ffr_210dm", name: "210 DM (Reguler)", price: 23500, icon: "fa-gamepad" },
        { id: "ffr_300dm", name: "300 DM (Reguler)", price: 31800, icon: "fa-gamepad" },
        { id: "ffr_355dm", name: "355 DM (Reguler)", price: 35500, icon: "fa-gamepad" },
        { id: "ffr_500dm", name: "500 DM (Reguler)", price: 52300, icon: "fa-gamepad" },
        { id: "ffr_720dm", name: "720 DM (Reguler)", price: 73800, icon: "fa-gamepad" },
        { id: "ffr_1000dm", name: "1000 DM (Reguler)", price: 100500, icon: "fa-gamepad" },
        { id: "ffr_1450dm", name: "1450 DM (Reguler)", price: 147800, icon: "fa-gamepad" },
        { id: "ffr_2180dm", name: "2180 DM (Reguler)", price: 216800, icon: "fa-gamepad" },
        { id: "ffr_3640dm", name: "3640 DM (Reguler)", price: 353500, icon: "fa-gamepad" },
        { id: "ffr_4000dm", name: "4000 DM (Reguler)", price: 387300, icon: "fa-gamepad" },
        { id: "ffr_7290dm", name: "7290 DM (Reguler)", price: 699800, icon: "fa-gamepad" },
    ],
    membershipsAndPacksFFRegular: [
        { id: "lup_ffr_lv6", name: "Level Up Pass Lv.6 (Reguler)", price: 15000, icon: "fa-ticket-alt" },
        { id: "lup_ffr_lv10", name: "Level Up Pass Lv.10 (Reguler)", price: 20000, icon: "fa-ticket-alt" },
        { id: "lup_ffr_lv15", name: "Level Up Pass Lv.15 (Reguler)", price: 25000, icon: "fa-ticket-alt" },
        { id: "lup_ffr_lv20", name: "Level Up Pass Lv.20 (Reguler)", price: 30000, icon: "fa-ticket-alt" },
        { id: "lup_ffr_lv25", name: "Level Up Pass Lv.25 (Reguler)", price: 35000, icon: "fa-ticket-alt" },
        { id: "lup_ffr_lv30", name: "Level Up Pass Lv.30 (Reguler)", price: 40000, icon: "fa-ticket-alt" },
        { id: "mem_ffr_week_50dm", name: "Membership Mingguan (50 DM, Reguler)", price: 18000, icon: "fa-calendar-week" },
        { id: "mem_ffr_month_50dm", name: "Membership Bulanan (50 DM, Reguler)", price: 73500, icon: "fa-calendar-alt" },
        { id: "bp_ffr_card", name: "Booyah Pass (BP Card, Reguler)", price: 55000, icon: "fa-award" },
    ]
};

const WHATSAPP_NUMBER = "+6285161258051";

function formatRupiah(angka) {
    if (typeof angka !== 'number' || isNaN(angka)) {
        return 'Harga tidak valid';
    }
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
    }).format(angka);
}

function handleBuy(productId, category) {
    let selectedProduct;
    if (products[category]) {
        selectedProduct = products[category].find(p => p.id === productId);
    } else {
        Swal.fire('Error', 'Kategori produk tidak valid.', 'error');
        return;
    }

    if (selectedProduct) {
        localStorage.setItem('selectedProduct', JSON.stringify(selectedProduct));
        window.location.href = '/checkout';
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Produk tidak ditemukan!',
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    if (primaryColor) {
        let rgbValues = null;
        if (primaryColor.startsWith('#')) {
            const hex = primaryColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                rgbValues = [r, g, b];
            }
        } else if (primaryColor.startsWith('rgb')) {
            const match = primaryColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
            if (match) {
                rgbValues = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
            }
        }
        if (rgbValues && rgbValues.length === 3) {
            document.documentElement.style.setProperty('--primary-color-rgb', `${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}`);
        } else {
             document.documentElement.style.setProperty('--primary-color-rgb', `0, 123, 255`);
        }
    } else {
         document.documentElement.style.setProperty('--primary-color-rgb', `0, 123, 255`);
    }
});