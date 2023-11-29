const axios = require("axios")

class HMSClientWeb {

    constructor(authToken) {
        this.authToken = authToken
        this.instance = axios.create({
            baseURL: "https://api.100ms.live/v2",
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        })
    }

    getRooms(options) {
        return this.instance.get("/rooms", { params: options }).then(response => response.data.data)

    }
    startRecording(roomId, params) {
        return this.instance.post(`/recordings/room/${roomId}/start`, { params }).then(response => response.data.data)
    }

    stopRecording(roomId, params) {
        return this.instance.post(`/recordings/room/${roomId}/stop`, { params }).then(response => response.data.data)
    }

    listRecording(parmas) {
        return this.instance.get(`/recording-assets`, { params: parmas }).then(response => response.data.data)
    }

    urlRecording(assetId) {
        return this.instance.get(`/recording-assets/${assetId}/presigned-url`).then(response => response.data)
    }

}
module.exports = HMSClientWeb