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
  function sqlStorageMigrationService($q, $injector, localStorageService) {
    var methods = {};

    methods._database = null;
    methods._updateMethods = updateMethods;
    methods.updateManager = updateManager;

    function updateManager(database, currentVersion) {
      methods._database = database;

      var DATABASE_VERSION_KEY = 'database_version';
      var versions = Object.keys(methods._updateMethods)
        .map(parseFloat)
        .sort(function (a, b) { return a - b; })
        .reduce(function (datas, updaterVersion) {
          if(updaterVersion > currentVersion) {
            datas.push(updaterVersion);
          }

          return datas;
        }, []);

      return versions.reduce(function(p, version) {
        return p.then(function() {
          return callMethod(version)
            .then(function() {
              return localStorageService.set(DATABASE_VERSION_KEY, version);
            });
        });
      }, $q.when());
    }

    function callMethod(updateKey) {
      return $injector.invoke(methods._updateMethods[updateKey], methods);
    }

    return methods;
  }
}
