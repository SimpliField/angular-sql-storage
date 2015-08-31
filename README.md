angular-sql-storage
=====================
Manage SQlLite connection and create tables.

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]


##Get Started
```bash
bower install angular-sql-storage --save
```
Include `angular-sql-storage.js` (or `angular-sql-storage.min.js`) from the [dist](https://github.com/SimpliField/angular-sql-storage/blob/master/angular-sql-storage.js) directory in your `index.html`, after including Angular itself.

Add `'sf.sqlStorage'` to your main module's list of dependencies.

When you're done, your setup should look similar to the following:

```html
<!doctype html>
<html ng-app="myApp">
<head>
   
</head>
<body>
    ...
    <script src="//ajax.googleapis.com/ajax/libs/angularjs/1.1.5/angular.min.js"></script>
    <script src="bower_components/angular-sql-storage/angular-sql-storage.min.js"></script>
    ...
    <script>
        var myApp = angular.module('myApp', ['sf.sqlStorage']);

    </script>
    ...
</body>
</html>
```
##Configuration
###setDatabaseConfig
You can define your name and database version number<br/>
The version number let you manage migrations automatically.<br/>
The service compares the current version with the latest and runs all updates accordingly<br/>
**Default:** `name: database.db` `version: 1`
```js
myApp.config(function (sqlStorageServiceProvider) {
  sqlStorageServiceProvider
    .setDatabaseConfig({
      name: 'myapp.db',
      version: 0.1
    });
});
```
###setDatabaseSchema
You need to define the table definition to create tables<br/>
**Params:**
- `defaultFields` [Array] - Define fields which appear in all tables
  - `name` [String] - Sql field name
  - `type` [String] - Sql field type
  - `primayKey` [Boolean] - Add PRIMARY KEY constraint to field.
  - `unique` [Boolean] - Add UNIQUE constraint to field.
- `tables` [Object] - Define tables with specific structure
  - `table_name` [String] - Name of table
  - `indexed_fields` [Array] - Add indexed fields to table (structure like defaultFields)
```js
myApp.config(function (sqlStorageServiceProvider) {
  sqlStorageServiceProvider
    .setDatabaseSchema({
      defaultFields: [{
        name: 'id',
        type: 'NVARCHAR(32)',
        primayKey: true,
        unique: true,
      }, {
        name: 'payload',
        type: 'TEXT',
      },
      tables: {
        users: {
          table_name: 'users',
          indexed_fields: [{
            name: 'age',
            type: 'INTEGER',
          }],
        },
      }]
    });
});
```
###setDatabaseInstance
Set the database instance instead of window.openDatabase.<br/>
Example, you can use cordova and [ngCordova](http://ngcordova.com/docs/plugins/sqlite/) to instantiate your database (Function is invoke by angular $injector.invoke service).
```js
myApp.config(function (sqlStorageServiceProvider) {
    sqlStorageServiceProvider
      .setDatabaseInstance(databaseInstance);
    function databaseInstance($cordovaSQLite) {
      return $cordovaSQLite.openDB('myapp.db', 1);
    }
});
```
###addUpdater
You could define migration scripts when you update your database schema. Just need to define verison and script.<br/>
You can access to this following instance variable :
- `this._database`: Database Instance.

**Params:**
- `version` [Float] - Version which need to run the script.
- `method` [Function] - Method to run by $injector.inoke().
```js
myApp.config(function (sqlStorageServiceProvider) {
  sqlStorageServiceProvider
    .addUpdater({
      version: 1.1,
      method: updateMethod,
    });

    function updateMethod($cordovaSQLite) {
      var _database = this._database;
      var query = 'ALTER TABLE users ADD COLUMN name TEXT';

      return $cordovaSQLite.execute(_database, query);
    });
});
```
##API Documentation
##initDatabase
Init instance if you want to update earlier. This method is called by getDatabase too.<br/>
**Returns:** `Database Instance`

###getDatabase
Just get database instance.<br/>
**Returns:** `Database Instance`

###initTables
Create Sql tables and run migration if needed<br/>
**Returns:** `Database Instance`

###deleteDatas
Drop all tables (of the database).

###execute
Helpers to execute sql queries.<br/>
**Returns:** `Query result`

[npm-image]: https://img.shields.io/npm/v/angular-sql-storage.svg?style=flat-square
[npm-url]: https://npmjs.org/package/angular-sql-storage
[travis-image]: https://img.shields.io/travis/SimpliField/angular-sql-storage.svg?style=flat-square
[travis-url]: https://travis-ci.org/SimpliField/angular-sql-storage
[coveralls-image]: https://img.shields.io/coveralls/SimpliField/angular-sql-storage.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/SimpliField/angular-sql-storage
[david-image]: http://img.shields.io/david/SimpliField/angular-sql-storage.svg?style=flat-square
[david-url]: https://david-dm.org/SimpliField/angular-sql-storage
[license-image]: http://img.shields.io/npm/l/angular-sql-storage.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/angular-sql-storage.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/angular-sql-storage
