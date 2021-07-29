(async function() {

    let response = await fetch("https://www.ahgora.com.br/api-espelho/apuracao/2021-07", {
        method: 'GET',
        credentials: 'include'
    })
    let temp = await response.json()
    console.log(temp)

})()
