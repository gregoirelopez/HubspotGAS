
function DEFAULT_API_CONFIG_HEADER(){
  return ["api_credential", "api_endpoint", "api_query_parameters", "object_formatting_spreadsheet_url","object_formatting_sheetname"]
}

function API_REQUESTER(){
  return {
    HUBSPOT : HUBSPOT,
    // Utile pour gérer les erreurs lors de la config des pages
    // Potentiellement source de bcp de merde. A vérifier
    undefined : function(){return false}
  }
}

function extractApiObjectsOnSpreadsheet(spreadsheet){
  spreadsheet = spreadsheet || SpreadsheetApp.getActive()
  const config      = _loadApiConfig(spreadsheet)
  const API         = API_REQUESTER()[config.apiName]() || false
  const endpoint    = (API.DESCRIBE()[config.request.api_endpoint] || {})

  const methods = Object.keys(endpoint).filter(function (key){ /* on parcourt toutes les méthodes du endpoint */
    // à chaque méthode, on cherche si elle a des callbacks, si oui, on cherche si GET est true
    return endpoint[key].callbacks ? (endpoint[key].callbacks.GET ? endpoint[key].callbacks.GET : false) : []
  })

  // si plusieurs méthodes sont retournées, on prend la première
  const method = methods[0] ? endpoint[methods[0]] : false

  const credential  = config.request.api_credential
  const options     = config.request.api_query_options != "" ? config.request.api_query_options : {}

  // Certains endpoints hubspot on un comportement particulier. Il faut donc le gérer et passer des options en paramètres
  options.nestedMapping = method.config.nested_mapping == "custom_sheet" ? {
    nestedKey     : method.config.nested_key,
    nestedUrlKey  : method.config.nested_key_url_param,
    nestedKeys    : ORM.readObjectsFromSheet(SpreadsheetApp.openByUrl(config.request.object_formatting_spreadsheet_url).getSheetByName(config.request.object_formatting_sheetname))
    // On filtre les propriétés affichable
    .filter(function(property){
      return property.requestable
    })
    // On retourne les clefs des propriétés demandées
    .map(function(property){
      return property.name
    })
  } : false


  const objects   = API.GET(credential, method, options)

  // ICI C'est dégueulasse et presque au petit bonheur la chance. A revoir le jours où le temps s'y prete
  const printingKeys = {
    objectKeys : method.display.object_keys == "default" ? // Si display est configuré en "default"
    Object.keys(objects[0] ? objects[0] : {})
    : (method.display.object_keys == "custom_sheet" ?  // Si display est configuré en "custom_sheet"
       ORM.readObjectsFromSheet(SpreadsheetApp.openByUrl(config.request.object_formatting_spreadsheet_url).getSheetByName(config.request.object_formatting_sheetname))
    // On filtre les propriétés affichable
    .filter(function(property){
      return property.requestable
    })
    // On retourne les clefs des propriétés demandées
    .map(function(property){
      return property.name
    })
    :
    // Si display est un array, par convention, il contient les clef à afficher
    ( Array.isArray(method.display.object_keys) ? method.display.object_keys : "object" ) ),

      nestedKey  : method.display.nested_key || null,

        nestedKeys : method.display.nested_key ?
          (method.display.nested_keys == "default" ?
           (objects[0][method.display.nested_key] ?
           (Array.isArray(objects[0][method.display.nested_key]) ? Object.keys(objects[0][method.display.nested_key][0]) : Object.keys(objects[0][method.display.nested_key]) )
        : false
        ) : null
        ) : null,
    }

  const outputSheet = spreadsheet.getSheetByName("OUTPUT="+config.request.api_endpoint) || spreadsheet.insertSheet("OUTPUT="+config.request.api_endpoint)

  ORM.writeObjectsOnSheet(outputSheet, objects, printingKeys.objectKeys, printingKeys.nestedKey, printingKeys.nestedKeys)

  return false
}


function _discoverKeysFromConfig(config) {
  return {
    objectKeys : _getObjectKeys(config),
    nestedKeys : false
  }
}

function _discoverKeysFromMethod(method) {
  return {
    objectKeys : Array.isArray(method.result.response_mapping) ? method.result.response_mapping : false,
    nestedKeys : false
  }
}

function _discoverKeysFromObject(object, nestedKey)   {
  const result = {
    objectKeys : Object.keys(object),
    nestedKeys : object[nestedKey] ?
    (Array.isArray(object[nestedKey]) ? Object.keys(object[nestedKey][0]) : Object.keys(object[nestedKey]) )
    : false  }
  return result
}

// Extract objectKeys from config
function _getObjectKeys(config){
  const spreadsheet = SpreadsheetApp.openByUrl(config.request.object_formating_spreadsheet_url)
  const sheet = spreadsheet.getSheetByName(config.request.object_formating_sheetname)
  return ORM.readObjectsFromSheet(sheet)
  // On trie les clés "printable"
  .filter(function(key){return key.printable})
  // On récupère le nom des clés
  .map(function(elem){
    return elem.name
  })
}

/**
* load the API configuration from the configuration sheet or create the configuration sheet if there is none
*
**/
function _loadApiConfig(spreadsheet){
  // On récupère le spreadsheet courant si spreasdsheet n'est pas passé en paramètres
  spreadsheet = spreadsheet || SpreadsheetApp.getActiveSpreadsheet()
  // On va chercher le nom de l'API à requêter dans le nom du sheet (format "API_CONFIG="
  const apiConfigSheet = spreadsheet.getSheets().filter(function (sheet){
    return sheet.getName().split("=")[0] == "API_CONFIG" ? true : false
  })[0]

  const apiName = apiConfigSheet ? apiConfigSheet.getName().split("=")[1] : "ENTER_API_NAME_HERE"
  // On récupère la feuille "settings" ou on l'initialise si elle n'existe pas déjà
  return {
    apiName : apiName != "ENTER_API_NAME_HERE" && apiName != "" ? apiName : undefined,
    request : apiConfigSheet ? // Si une sheet de configuration d'API est présente
    // Si le nom de l'API a déjà été entré
    ( apiName != "ENTER_API_NAME_HERE" ?
    // Si le sheet a déjà été correctement initialisé, on lit la config
    ( apiConfigSheet.getFrozenRows() > 0 ? ORM.readObjectsFromSheet(apiConfigSheet)[0]
    //Si le sheet a été créé mais l'initialisation n'a pas abouti, on crée le header
    : apiConfigSheet.appendRow(DEFAULT_API_CONFIG_HEADER()).setFrozenRows(1)
    // Si le sheet n'a pas déjà été initialisé
    )
    : undefined
    )
    // Si la fiche de config n'est pas présente, elle est créée
    : spreadsheet.insertSheet("API_CONFIG="+apiName).clearConditionalFormatRules() ,
  }
}


/**
* Returns available APIs in API_REQUESTER
*
**/
function describeAvailableApis(){
  return Object.keys(API_REQUESTER())
}
