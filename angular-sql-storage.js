(function() {
"use strict";

angular
  .module('sf.sqlStorage', [
    'LocalStorageModule',
  ]);

angular
  .module('sf.sqlStorage')
  .provider('sqlStorageMigrationService', _sqlStorageMigrationService);

function _sqlStorageMigrationService() {
  sqlStorageMigrationService.$inject = ["$q", "$injector"];
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

(function iife() {
  'use strict';

  _sqlStorageService.$inject = ["sqlStorageMigrationServiceProvider"];
  var DATABASE_VERSION_KEY = 'database_version';

  angular
    .module('sf.sqlStorage')
    .provider('sqlStorageService', _sqlStorageService);

  // @ngInject
  function _sqlStorageService(sqlStorageMigrationServiceProvider) {
    sqlStorageService.$inject = ["$q", "$window", "$log", "$injector", "localStorageService", "sqlStorageMigrationService"];
    var _databaseName = 'database.db';
    var _databaseVersion = 1;
    var _databaseSchema = null;
    var _databaseInstance = null;

    this.$get = sqlStorageService;

    this.setDatabaseConfig = setDatabaseConfig;
    this.setDatabaseSchema = setDatabaseSchema;
    this.setDatabaseInstance = setDatabaseInstance;
    this.addUpdater = addUpdater;

    function setDatabaseConfig(config) {
      _databaseName = config.name;
      _databaseVersion = config.version;
    }
    function setDatabaseSchema(databaseSchema) {
      _databaseSchema = databaseSchema;
    }
    function setDatabaseInstance(databaseInstance) {
      _databaseInstance = databaseInstance;
    }
    function addUpdater(configMethod) {
      sqlStorageMigrationServiceProvider.addUpdater(configMethod);
    }

    // @ngInject
    function sqlStorageService($q, $window, $log, $injector,
    localStorageService, sqlStorageMigrationService) {
      var methods = {};
      var sqlInstance = null;

      if(!_databaseSchema) {
        $log.error('Please set a database configuration');
        _databaseSchema = {};
      }

      methods.createPromise = null;

      methods.tables = _databaseSchema.tables || {};

      // Methods
      methods.initDatabase = initDatabase;
      methods.getDatabase = getDatabase;
      methods.initTables = initTables;
      methods.deleteDatas = deleteDatas;
      methods.createTables = createTables;
      methods.execute = execute;

      /**
       * Init database
       * @return {Object} SQLite instance
       */
      function initDatabase() {
        sqlInstance = (_databaseInstance) ?
          $injector.invoke(_databaseInstance) :
          $window.openDatabase(_databaseName, '1.0', 'database', 200000);

        return sqlInstance;
      }

      /**
       * Get database instace
       * @return {Object} SQLite instance
       */
      function getDatabase() {
        return (!sqlInstance) ? this.initDatabase() : sqlInstance;
      }
      /**
       * Create tables
       * @return {Object} SQLite instance
       */
      function initTables() {
        var _this = this;
        var tables = this.tables;

        if(this.createPromise) { return this.createPromise; }

        this.createPromise = this.createTables(_databaseSchema.defaultFields, tables)
          .then(createSucceed);

        return this.createPromise;

        function createSucceed() {
          var database = _this.getDatabase();
          var currentVersion = localStorageService.get(DATABASE_VERSION_KEY) || 0;

          $log.debug('[Storage] Create DB SUCCESS');

          return (currentVersion && currentVersion < _databaseVersion) ?
            sqlStorageMigrationService.updateManager(database, currentVersion)
              .then(saveDatabaseVersion) :
            saveDatabaseVersion();

          function saveDatabaseVersion() {
            localStorageService.set(DATABASE_VERSION_KEY, _databaseVersion);
            return database;
          }
        }
      }

      /**
       * Create table
       * @param  {Array}  defaultFields - Fields for all tables
       * @param  {Object} tables        - Tables definition
       * @return {Promise} Tables create
       */
      function createTables(defaultFields, tables) {
        var _this = this;
        var fields = (defaultFields || []).map(fieldConstruction);
        var queries = Object.keys(tables).map(function(tableKey) {
          var query = constructCreateQuery(tables[tableKey], fields);

          return _this.execute(query);
        });

        return $q.all(queries);
      }

      /**
       * Clear All datas
       * @return {Object} promise of db clear
       */
      function deleteDatas() {
        var _this = this;
        var tablesName = Object.keys(this.tables).map(function(tableKey) {
          return _this.tables[tableKey].table_name;
        });

        // Databases
        var queries = tablesName.map(function(tableName) {
          var request = 'DROP TABLE IF EXISTS ' + tableName;

          return _this.execute(request);
        });

        // Local Storage
        localStorageService.clearAll();

        return $q.all(queries).then(function(data) {
          _this.createPromise = null;
          $log.debug('[Storage] Drop DB SUCCESS');
          return data;
        });
      }


      //---------------
      //
      //    HELPERS
      //
      //---------------
      /**
       * Make sqlLite request
       *
       * @param  {String} query     - SQL Query
       * @param  {[Array]} binding  - Datas for querying
       * @return {Promise}          - Request result
       */
      function execute(query, binding) {
        var q = $q.defer();
        var database = this.getDatabase();

        database.transaction(function(tx) {
          tx.executeSql(query, binding, function(sqlTx, result) {
            q.resolve(result);
          }, function(transaction, error) {
            q.reject(error);
          });
        });
        return q.promise;
      }

      /**
       * Construct the create table query.
       *
       * @param  {Object} table - Table definition
       * @param  {Array} fields - Default fields
       * @return {String}       - Create request
       */
      function constructCreateQuery(table, fields) {
        var indexedFields = table.indexed_fields || [];
        var tableFields = fields.concat(indexedFields.map(fieldConstruction));

        // var fields
        return [
          'CREATE TABLE IF NOT EXISTS',
          table.table_name,
          '(' + tableFields.join(', ') + ')',
        ].join(' ');
      }

      /**
       * Create the definition of the field
       *
       * @param  {Object} field - Field configuration
       * @return {String}       - Field definition
       */
      function fieldConstruction(field) {
        var fieldDefinition = [field.name, field.type];

        if(field.unique) { fieldDefinition.push('UNIQUE'); }
        if(field.primayKey) { fieldDefinition.push('PRIMARY KEY'); }

        return fieldDefinition.join(' ');
      }

      return methods;
    }
  }
}());
}());
