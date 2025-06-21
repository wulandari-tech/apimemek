const axios = require('axios');

module.exports = (app, apiKeyAuth, isAuthenticated, configObjects) => {
    const { loghandler, creator } = configObjects;
    const characterMap = { 10000007: 'Traveler (Anemo)', 10000005: 'Traveler (Geo)', 10000002: 'Kamisato Ayaka', 10000003: 'Jean', 10000006: 'Lisa', 10000014: 'Barbara', 10000015: 'Kaeya', 10000016: 'Diluc', 10000020: 'Razor', 10000021: 'Amber', 10000022: 'Venti', 10000023: 'Xiangling', 10000024: 'Beidou', 10000025: 'Xingqiu', 10000026: 'Xiao', 10000027: 'Ningguang', 10000029: 'Klee', 10000030: 'Zhongli', 10000031: 'Fischl', 10000032: 'Bennett', 10000033: 'Tartaglia', 10000034: 'Noelle', 10000035: 'Qiqi', 10000036: 'Chongyun', 10000037: 'Ganyu', 10000038: 'Albedo', 10000039: 'Diona', 10000041: 'Mona', 10000042: 'Keqing', 10000043: 'Sucrose', 10000044: 'Xinyan', 10000045: 'Rosaria', 10000046: 'Hu Tao', 10000047: 'Kaedehara Kazuha', 10000048: 'Yanfei', 10000049: 'Yoimiya', 10000050: 'Thoma', 10000051: 'Eula', 10000052: 'Raiden Shogun', 10000053: 'Sayu', 10000054: 'Sangonomiya Kokomi', 10000055: 'Gorou', 10000056: 'Kujou Sara', 10000057: 'Arataki Itto', 10000058: 'Yae Miko', 10000059: 'Shikanoin Heizou', 10000060: 'Yelan', 10000062: 'Aloy', 10000063: 'Shenhe', 10000064: 'Yun Jin', 10000065: 'Kuki Shinobu', 10000066: 'Kamisato Ayato', 10000067: 'Collei', 10000068: 'Dori', 10000069: 'Tighnari', 10000070: 'Nilou', 10000071: 'Cyno', 10000072: 'Candace', 10000073: 'Nahida', 10000074: 'Layla', 10000075: 'Wanderer', 10000076: 'Faruzan', 10000077: 'Yaoyao', 10000078: 'Alhaitham', 10000079: 'Dehya', 10000080: 'Mika', 10000081: 'Kaveh', 10000082: 'Baizhu', 10000083: 'Kirara', 10000084: 'Lynette', 10000085: 'Lyney', 10000086: 'Freminet', 10000087: 'Wriothesley', 10000088: 'Neuvillette', 10000089: 'Charlotte', 10000090: 'Furina', 10000091: 'Chevreuse', 10000092: 'Navia', 10000093: 'Gaming', 10000094: 'Xianyun', 10000095: 'Chiori', 10000096: 'Arlecchino', 10000097: 'Clorinde', 10000098: 'Sethos', 10000099: 'Sigewinne', /* Add more as they are released */};


    async function genshinStalk(uid) {
        const url = `https://enka.network/api/uid/${uid}`;
        try {
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'GeForceAPI/1.0' } }); // Custom User-Agent
            if (!data || !data.playerInfo) throw new Error('Player data not found or invalid UID.');
            const { playerInfo, avatarInfoList } = data; // Enka sometimes uses avatarInfoList at root
            const shownAvatars = playerInfo.showAvatarInfoList || avatarInfoList || [];

            return {
                uid: data.uid,
                nickname: playerInfo.nickname,
                level: playerInfo.level,
                signature: playerInfo.signature,
                worldLevel: playerInfo.worldLevel,
                nameCardId: playerInfo.nameCardId,
                finishAchievementNum: playerInfo.finishAchievementNum,
                towerFloorIndex: playerInfo.towerFloorIndex,
                towerLevelIndex: playerInfo.towerLevelIndex,
                profilePicture: {
                    id: playerInfo.profilePicture?.avatarId,
                    name: characterMap[playerInfo.profilePicture?.avatarId] || `Unknown (${playerInfo.profilePicture?.avatarId})`
                },
                showAvatarInfoList: shownAvatars.map(char => ({
                    avatarId: char.avatarId,
                    name: characterMap[char.avatarId] || `Unknown (${char.avatarId})`,
                    level: char.level,
                    costumeId: char.costumeId || null
                }))
            };
        } catch (e) {
            console.error(`Genshin Stalk Error for UID ${uid}:`, e.response?.data || e.message);
            throw new Error(`Failed to retrieve Genshin data for UID ${uid}. It might be private or invalid.`);
        }
    }

    app.get("/api/genshinstalk", apiKeyAuth, async (req, res) => { // Corrected route name
        try {
            const { uid } = req.query; // Changed q to uid for clarity
            if (!uid || !/^\d+$/.test(uid)) return res.status(400).json(loghandler.notparam("uid (numeric player UID)"));
            const result = await genshinStalk(uid);
            if (res.locals.incrementApiUsage) await res.locals.incrementApiUsage();
            res.status(200).json({ status: true, creator, result });
        } catch (error) {
            res.status(500).json(loghandler.fetchError("Genshin Impact Stalk"));
        }
    });
};