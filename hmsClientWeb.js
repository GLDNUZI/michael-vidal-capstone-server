const axios = require("axios")

 class HMSClientWeb{

    constructor(authToken){
        this.authToken = authToken
        this.instance = axios.create({
            baseURL:"https://api.100ms.live/v2",
            headers:{ 
                "Authorization": `Bearer ${authToken}`
            }
        })
    }

    getRooms(options){
        return this.instance.get("/rooms", {params: options}).then(response=>response.data.data)

    }
}
module.exports= HMSClientWeb