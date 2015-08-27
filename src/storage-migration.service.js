angular
  .module('sfMobile.storage')
  .provider('migrationService', _migrationService);

function _migrationService() {
  var updateMethods = {};

  this.addUpdater = addUpdater;
  this.$get = migrationService;

  function addUpdater(configMethod) {
    updateMethods[configMethod.version] = configMethod.method;
  }

  // @ngInject
  function migrationService($q, $injector) {
    var methods = {};

    methods._database = null;
    methods._updateMethods = updateMethods;
    methods.updateManager = updateManager;

    function updateManager(database, currentVersion) {
      var updates;

      methods._database = database;
      updates = Object.keys(methods._updateMethods).reduce(function(datas, updateKey) {
        updateKey = parseFloat(updateKey);
        if(updateKey > currentVersion) {
          datas.push(callMethod(updateKey));
        }

        return datas;
      }, []);

      return $q.all(updates);
    }

    function callMethod(updateKey) {
      return $injector.invoke(methods._updateMethods[updateKey], methods);
    }

    return methods;
  }
}
