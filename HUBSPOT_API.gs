function HUBSPOT() {
  return {
    GET : function (credential, method, options) {
      return method ? _getHubspotObjects (credential, method, options, HUBSPOT().DEBUG) : console.log("Couldn't find any GET callback in given endpoint")
    },
    //TO DO pour décrire les fonctions dispos dans l'API
    DESCRIBE : _HUBSPOT_ENDPOINT_DESCRIPTION,
    FORMAT   : function () {
      return {
        contact_formatter  : _formatContact,
        deal_formatter     : _formatDeal,
        company_formatter  : _formatCompany,
      }
    },
    DISPLAY   : function () {
      return {
        contact_formatter  : _formatContact,
        deal_formatter     : _formatDeal,
        company_formatter  : _formatCompany,
      }
    },
    DEBUG    : true,
  }
}



function _getHubspotObjects(credential, method, options, debug){
  console.log("HUBSPOT >> Enters function _getHubspotObjects()")

  // S'il y a des propriétés, on en extrait les queryParams associés
  const queryParams  = options.nestedMapping ? _getQueryParams(options.nestedMapping) : ""

  // On fait la requête à Hubspot et on la renvoie
  const result =  _getHubspot(credential, method, "", queryParams, debug)
  // On log la fin de l'éxecution
  console.log("HUBSPOT >> Exists function _getHubspotObjects()")
  return result

}


function _getHubspot(credential, method, param, queryParams, debug) {
  console.log("HUBSPOT >> Enters function _getHubspot()")
  console.log(debug ? "DEBUG_MODE: ON\nRequest has been limitated" : "DEBUG_MODE: OFF")
  var result = new Array()
  var response = null
  do {
    var url = (
      // On authentifie la requête
      _authentifyUrl(_getUrl(method, param),credential)
      // On ajoute les paramètres de limit s'il y en a
      +(method.config.limit ? "&"+method.config.limit_url_param+"="+method.config.limit : "" )
    // On rajoute les éventuels queryParams
    +(queryParams ? queryParams : "")
    // Ainsi que les éventuels extra_params hérités de la method
    +(method.config.extra_params || "")
    // Si il y a vait une réponse à l'itération précédente, on ajoute le paramètre d'offset
    + (response ? (_configHasValidOffset(method) ?
                   (response[method.config.offset_key]?"&"+method.config.offset_url_param+"="+response[method.config.offset_key] : "")
                   : "INVALID_URL_OFFSET_CONFIG" )
       : "" )
    )
    // On requête l'API
    response  = JSON.parse(UrlFetchApp.fetch(url,{"muteHttpExceptions":true}).getContentText())

    var objects =  (
      response.status ? console.log("API returned an error:\n"+response) :
      // Comme la réponse de l'API d'hubspot est différente en fonction du endpoint, on prend en compte les différentes réponses
      (response[method.result.response_key] ? response[method.result.response_key].map(function (element) {
        return (element)
      }) : response)
      // On ajoute un attribut "object" à l'élément courant dans lequel on enregistre le type de l'objet retourné
      .map(function(elem){
        elem.object = method.result.object_name
        // On _flatten l'object si besoin, sinon on renvoit l'objet
        //return /*method.result.nested_key ? _flattenObject(elem,method.result.nested_key) : */ elem
        return method.result.format_function ? HUBSPOT().FORMAT()[method.result.format_function](elem) : elem
      }))
    // We add the new objects to the result
    result = result.concat(objects)
    // We add a sleep(500) to stay under hubspot's limitations
    Utilities.sleep(500)
    // We ask the API while there is more elements
  } while (debug ? false : (method.config.paginer ? response[method.config.paginer] : false))
    // usefull log
    console.log("HUBSPOT >> Exits function _getHubspot()")
    // We return the final result
    return result
}

function _formatContact(contact) {
  return _formatHubspotObjectWithProperties(contact, "properties")
}

function _formatDeal(deal) {
  return  _formatHubspotObjectWithProperties(deal, "properties")
}

function _formatCompany(company) {
  return _formatHubspotObjectWithProperties(company, "properties")
}

function _formatHubspotObjectWithProperties(object, propertiesKey) {
  return Object.keys(object[propertiesKey]).reduce(function (acc, key){
    acc[key] = object[propertiesKey][key].value || ""
    return acc
  },object)
}

function _getQueryParams(mapping) {
  return mapping.nestedKeys.reduce(function(acc,key){
    return acc+"&"+mapping.nestedUrlKey+"="+key
  },"")
}

function _isValidHSObjectProperties(objectProperty){
  return objectProperty.spreadsheet_url && objectProperty.target_sheetname ? true : false
}


function _configHasValidUrl(method) {
  return (method.config || {}).url ? true : false
}

function _configHasValidOffset (method) {
  return (method.config || {}).offset_key && (method.config || {}).offset_url_param  ? true : false
}

function _getUrl(method, param) {
  return _configHasValidUrl(method) ? method.config.url.replace("{{PARAM}}",param || "{{PARAM}}")
  : "http://MISSING_URL_VALUE"
}

function _authentifyUrl(url, credential){
  return url+"\?hapikey="+((credential || {} ).token || "MISSING_CREDENTIAL_TOKEN")
}
