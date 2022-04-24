const axios = require('axios').default;

axios.get('https://openapi.debank.com/v1/user/token_list?id=0x5bfF1A68663ff91b0650327D83D4230Cd00023Ad&is_all=true')
    .then(resp => {
        console.log(resp.data);
    })
    .catch(err => {
        // Handle Error Here
        console.error(err);
    });