function _HUBSPOT_ENDPOINT_DESCRIPTION(){
  return {
    contact_properties:
    {
      getAll     : {
        config:{
          url              : "https://api.hubapi.com/properties/v1/contacts/properties",
        },
        result   : {
          object_name      : "contact_property",
        },
        callbacks    :  {
          GET : true,
        },
        display :{
          object_keys : ["printable","requestable","updatable","nestable","object","name","label","description","groupName","type"],
        }
      },
    },
    deal_properties:
    {
      getAll     : {
        config:{
          url              : "https://api.hubapi.com/properties/v1/deals/properties",
        },
        result   : {
          object_name          : "deal_property",
        },
        callbacks    :  {
          GET : true,
        },
        display :{
          object_keys : ["printable","requestable","updatable","nestable","object","name","label","description","groupName","type"],
        }
      },
    },
    company_properties:
    {
      getAll     : {
        config:{
          url              : "https://api.hubapi.com/properties/v1/companies/properties",
        },
        result   : {
          object_name          : "company_property",
        },
        callbacks    :  {
          GET : true,
        },
        display :{
          object_keys : ["printable","requestable","updatable","nestable","object","name","label","description","groupName","type"],
        }
      },
    },
    contacts : {
      getAll     : {
        config   : {
          url                  : "https://api.hubapi.com/contacts/v1/lists/all/contacts/all",
          limit                : 100,
          limit_url_param      : "count",
          paginer              : "has-more",
          offset_key           : "vid-offset",
          offset_url_param     : "vidOffset",
          // S'il faut des clefs supplémentaires pour récupérer l'objet, on l'ajoute ici
          nested_mapping       : "custom_sheet",
          // Quelle est la clef qu'il faut requêter
          nested_key           : "properties",
          // Quelle est le nom de cette clef dans l'URL
          nested_key_url_param : "property",
          extra_params         : false,

        },
        result   : {
          object_name          : "contact",
          response_key         : "contacts",
          format_function      : "contact_formatter",
          response_mapping     : "custom_sheet"
        },
        callbacks    :  {
          GET : true,
        },
        display : {
          object_keys : "custom_sheet",
        }
      },
    },
    deals : {
      getAll     : {
        config   : {
          url                  : "https://api.hubapi.com/deals/v1/deal/paged",
          limit                : 250,
          limit_url_param      : "limit",
          paginer              : "hasMore",
          offset_key           : "offset",
          offset_url_param     : "offset",
          nested_mapping       : "custom_sheet",
          nested_key           : "properties",
          nested_key_url_param : "properties",
          extra_params         : "&includeAssociations=true",
        },
        result   : {
          object_name          : "deal",
          response_key         : "deals",
          format_function      : "deal_formatter",
          response_mapping     : "custom_sheet"
        },
        callbacks    :  {
          GET : true,
        },
        display : {
          object_keys : "custom_sheet",
        }
      },
    },
    companies : {
      getAll     : {
        config   : {
          url                  : "https://api.hubapi.com/companies/v2/companies/paged",
          limit                : 250,
          limit_url_param      : "limit",
          paginer              : "has-moreore",
          offset_key           : "offset",
          offset_url_param     : "offset",
          nested_mapping       : "custom_sheet",
          nested_key           : "properties",
          nested_key_url_param : "properties",
          extra_params         : "&includeAssociations=true",
        },
        result   : {
          object_name          : "company",
          response_key         : "companies",
          format_function      : "company_formatter",
          response_mapping     : "custom_sheet"
        },
        callbacks    :  {
          GET : true,
        },
        display : {
          object_keys : "custom_sheet",
        }
      },
    },
    /* le endpoint des deals_pipelines */
    deals_pipelines : {
      /* La première méthode du endpoint */
      getAll     : {
        /* la config du endpoint */
        config   : {
          url              : "https://api.hubapi.com/crm-pipelines/v1/pipelines/deals",
        },
        /* des infos sur le résultat attendu */
        result   : {
          object_name          : "deal_pipeline",
          response_key         : "results",
          response_mapping     : "default"
        },
        /* une liste de callbacks pouvant appeler cette méthode */
        callbacks    :  {
          GET : true,
        },
        display : {
          object_keys : "default",
          nested_key  : "stages",
          nested_keys : "default"
        }
      },
    },
  }
}
