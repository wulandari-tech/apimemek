global.lolkey = "RyAPI"
global.creator = 'Fahrizal';
const token = 'mongodb+srv://fahrizal:6%40PuaiCWpLs_6Wg@cluster0.t7uenwm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

global.loghandler = {
  error: {
    status: false,
    code: 503,
    message: '[!] Service Unavailable, Sedang dalam perbaikan',
    maintanied_by: `${creator}`
  },
  notapikey: {
    status: false,
    code: 403,
    message: '[!] Forbidden or Error, masukan parameter apikey',
    maintanied_by: `${creator}`
  },
  noturl: {
    status: false,
    code: 403,
    message: '[!] Forbidden or Error, masukan parameter url',
    maintanied_by: `${creator}`
  },
  notq: {
    status: false,
    code: 404,
    message: '[!] Forbidden or Error, masukan parameter q',
    maintanied_by: `${creator}`
  },
  notid: {
    status: false,
    code: 403,
    message: '[!] Forbidden or Error, masukan parameter id',
    maintanied_by: `${creator}`
  },
  notusername: {
    status: false,
    code: 403,
    message: '[!] Forbidden or Error, masukan parameter username',
    maintanied_by: `${creator}`
  },
  notserver: {
    status: false,
    code: 403,
    message: '[!] Forbidden or Error, masukan parameter server',
    maintanied_by: `${creator}`
  },
  nottext: {
    status: false,
    code: 404,
    message: '[!] Forbidden or Error, masukan parameter text',
    maintanied_by: `${creator}`
  },
  nottext1: {
    status: false,
    code: 404,
    message: '[!] Forbidden or Error, masukan parameter text1',
    maintanied_by: `${creator}`
  },
  nottext2: {
    status: false,
    code: 403,
    message: '[!] Forbidden or Error, masukan parameter text2',
    maintanied_by: `${creator}`
  },
  nottext3: {
    status: false,
    code: 403,
    message: '[!] Forbidden or Error, masukan parameter text3',
    maintanied_by: `${creator}`
  }
};

module.exports = { token };