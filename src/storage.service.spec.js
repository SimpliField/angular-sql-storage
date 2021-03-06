(function() {
  'use strict';

  describe('[Storage] Services', function() {
    var sqlStorageService;
    var executeStub;
    var databaseVersion = 1.1;
    var executeSql = { executeSql: function(query, binding, success, error) {} };
    var sqlInstance = {
      openDatabase: function() {
        return {
          test: 'test',
          transaction: function(cb) { cb(executeSql); },
        };
      },
    };
    var databaseSchema = {
      defaultFields: [{
        name: 'id',
        type: 'NVARCHAR(32)',
        primayKey: true,
        unique: true,
      }, {
        name: 'payload',
        type: 'TEXT',
      }],
      tables: {
        profile: {
          table_name: 'profile',
        },
        campaigns: {
          table_name: 'campaigns',
          indexed_fields: [{
            name: 'needLocation',
            type: 'INTEGER',
          }],
        },
        places: {
          table_name: 'places',
        },
        missions: {
          table_name: 'missions',
          indexed_fields: [{
            name: 'location_id',
            type: 'NVARCHAR(32)',
          }],
        },
        results: {
          table_name: 'results',
          indexed_fields: [{
            name: 'localStatus',
            type: 'TEXT',
          }, {
            name: 'campaign_id',
            type: 'NVARCHAR(32)',
          }],
        },
      },
    };

    function initContext(setSchema) {
      // load the controller's module
      module('sf.sqlStorage', function(sqlStorageServiceProvider) {
        sqlStorageServiceProvider.setDatabaseConfig({
          version: databaseVersion,
          name: 'test.db',
        });
        sqlStorageServiceProvider.setDatabaseInstance(function() {
          return sqlInstance.openDatabase();
        });
        if(setSchema) {
          sqlStorageServiceProvider.setDatabaseSchema(databaseSchema);
        }
      });

      // Initialize the controller and a mock scope
      inject(function(_sqlStorageService_) {
        sqlStorageService = _sqlStorageService_;
        executeStub = sinon.stub(sqlStorageService, 'execute');
      });
    }

    //---------------
    //
    //   Datas
    //
    //---------------
    describe('Get datas', function() {
      beforeEach(function() { initContext(true); });

      it('should get database with cordova', inject(function() {
        var openStub = sinon.stub(sqlInstance, 'openDatabase').returns('ok');
        var database;

        database = sqlStorageService.getDatabase();

        expect(openStub.callCount).equal(1);
        expect(database).equal('ok');

        database = sqlStorageService.getDatabase();
        expect(openStub.callCount).equal(1);

        openStub.restore();
      }));
    });


    //---------------
    //
    //   Create
    //
    //---------------
    describe('Init', function() {
      beforeEach(function() { initContext(false); });

      it('should init whith empty schema', inject(function() {
        sqlStorageService.initTables();

        expect(executeStub.callCount).equal(0);
      }));
    });

    describe('Create', function() {
      var localSetStub;
      var localGetStub;

      beforeEach(function() { initContext(true); });

      beforeEach(inject(function(localStorageService) {
        localSetStub = sinon.stub(localStorageService, 'set');
        localGetStub = sinon.stub(localStorageService, 'get');
      }));

      it('should create tables with migration', inject(
        function($q, $timeout, sqlStorageMigrationService) {
          var data;
          var updateStub = sinon.stub(sqlStorageMigrationService, 'updateManager').returns(
            $q.when('ok')
          );

          executeStub.returns($q.when('ok'));
          localGetStub.returns(1);

          expect(sqlStorageService.createPromise).equal(null);

          sqlStorageService.initTables().then(function(_data_) {
            data = _data_;
          });

          expect(sqlStorageService.createPromise).not.equal(null);
          expect(executeStub.callCount).equal(5);

          Object.keys(sqlStorageService.tables).forEach(function(table, index) {
            var tableName = sqlStorageService.tables[table].table_name;
            var queryRequest = 'CREATE TABLE IF NOT EXISTS';
            var queryFielsRequest = 'id NVARCHAR(32) UNIQUE PRIMARY KEY, payload TEXT';

            expect(executeStub.args[index][0]).contain(queryRequest);
            expect(executeStub.args[index][0]).contain(tableName);
            expect(executeStub.args[index][0]).contain(queryFielsRequest);
            if('results' === tableName) {
              expect(executeStub.args[index][0]).contain(', localStatus TEXT');
            }
          });

          // Called only once.
          sqlStorageService.initTables();
          expect(executeStub.callCount).equal(5);

          $timeout.flush();

          expect(updateStub.callCount).equal(1);
        }));

      it('should create tables without migration', inject(function($q, $timeout) {
        var data = null;

        localGetStub.returns(1.1);
        executeStub.returns($q.when('ok'));

        sqlStorageService.initTables().then(function(_data_) {
          data = _data_;
        });

        $timeout.flush();

        expect(localSetStub.callCount).equal(1);
        expect(data.test).equal('test');
      }));
    });


    //---------------
    //
    //    Clear
    //
    //---------------
    describe('Clear', function() {
      beforeEach(function() { initContext(true); });

      it('should drop tables', inject(function($q, localStorageService, $timeout) {
        var data;
        var clearStorageStub = sinon.stub(localStorageService, 'clearAll');

        executeStub.returns($q.when('ok'));

        sqlStorageService.deleteDatas().then(function(_data_) {
          data = _data_;
        });

        expect(clearStorageStub.callCount).equal(1);
        expect(executeStub.callCount).equal(5);

        Object.keys(sqlStorageService.tables).forEach(function(table, index) {
          var tableName = sqlStorageService.tables[table].table_name;

          expect(executeStub.args[index][0]).contain('DROP TABLE IF EXISTS');
          expect(executeStub.args[index][0]).contain(tableName);
        });

        $timeout.flush();

        expect(data).lengthOf(5);
      }));
    });


    //---------------
    //
    //    Execute
    //
    //---------------
    describe('Execute', function() {
      var data;
      var executeSqlStub;

      beforeEach(function() { initContext(true); });

      beforeEach(inject(function() {
        executeStub.restore();
        executeSqlStub = sinon.stub(executeSql, 'executeSql');
      }));
      afterEach(function() {
        executeSqlStub.restore();
      });

      it('should execute request', inject(function($timeout) {
        executeSqlStub.yields('test', 'testResult');

        sqlStorageService.execute('test', []).then(function(_data_) {
          data = _data_;
        });

        $timeout.flush();

        expect(data).equal('testResult');
      }));

      it('should failed to execute request', inject(function($timeout) {
        sqlStorageService.execute('test', []).catch(function(_data_) {
          data = _data_;
        });

        executeSqlStub.callArgWith(3, 'test', 'testError');

        $timeout.flush();

        expect(data).equal('testError');
      }));
    });

  });
}());
