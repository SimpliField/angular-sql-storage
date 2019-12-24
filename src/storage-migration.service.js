angular
  .module('sf.sqlStorage')
  .provider('sqlStorageMigrationService', _sqlStorageMigrationService);

function _sqlStorageMigrationService() {
  var updateMethods = {};

  this.addUpdater = addUpdater;
  this.$get = sqlStorageMigrationService;

  function addUpdater(configMethod) {
    updateMethods[configMethod.version] = configMethod.method;
  }

  // @ngInject
  function sqlStorageMigrationService($q, $injector) {
    var methods = {};

    methods._database = null;
    methods._updateMethods = updateMethods;
    methods.updateManager = updateManager;

    function updateManager(database, currentVersion) {
      methods._database = database;

      var updates = Object.keys(methods._updateMethods)
        .sort()
        .reduce(function(datas, updaterVersion) {
          updaterVersion = parseFloat(updaterVersion);
          if(updaterVersion > currentVersion) {
            datas.push(callMethod(updaterVersion));
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
