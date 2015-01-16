dronePass-Planner
=================
> Planner is the central server of the dronePass project. The server will manage permissions suggested by property owners and authorities. Drones in flight will maintain communication with Planner and adjust their flight paths as permission levels change.

![Alt text](/../screen/screenshots/administrator.png "Location in System Architecture")

## Team

  - __Product Owner__: David Raleigh
  - __Scrum Master__: Liz Portnoy
  - __Development Team Members__: Dennis Lin, Arthur Chan

## Postgres Database Setup
In order to run tests locally a developer will need a Postgres database setup with the PostGIS extension enabled. The following is the step by step process to get the database setup and running. If you already have the `parcel_v1.sql`, the `Drone_Pass_Control_create.sql`, and the `Prepare_Parcel_Data.sql` files, then you can rock the following lines thoughtlessly to try and get your database up and running:

### Super-Fast-No-Reading Postgres Setup (if you're having trouble make sure Postgres is installed and that it is in your $PATH):

Create Database
``` bash
$ createuser -P -s -e dronepass
$ psql -c 'CREATE DATABASE dronepass;'
$ psql -c 'GRANT ALL PRIVILEGES ON DATABASE dronepass to dronepass;'
$ psql -U dronepass -d dronepass
dronepass=# CREATE EXTENSION postgis;
```
Take in dump files
``` bash
$ psql --set ON_ERROR_STOP=on -d dronepass -f parcel_v1.sql
$ psql -d dronepass -U dronepass -h <host> -a -f Prepare_Parcel_Data.sql
$ psql -d dronepass -U dronepass -h <host> -a -f Drone_Pass_Control_create.sql
```

If you're running unit tests you'll need to make a ```dronepasstest``` database:
```bash
$ psql -c 'CREATE DATABASE dronepasstest;'
$ psql -c 'GRANT ALL PRIVILEGES ON DATABASE dronepasstest to dronepass;'
$ psql -U dronepass -d dronepasstest
dronepasstest=# CREATE EXTENSION postgis;
dronepasstest=# \q
$ psql --set ON_ERROR_STOP=on -d dronepasstest -f parcel_v1.sql
$ psql -d dronepasstest -U dronepass -h <host> -a -f Prepare_Parcel_Data.sql
$ psql -d dronepasstest -U dronepass -h <host> -a -f Drone_Pass_Control_create.sql
```

### Postgres
Follow the instructions on the [Postgres installation page](http://postgis.net/install/) in order to get yourself the latest and greatest 9.4 version. Postgres 9.4 only plays nicely with PostGIS 2.1 and later versions. The following assumes that you've added the Postgres bin to your path. First you'll need to create a super user name `dronepass`:

``` bash
$ createuser -P -s -e dronepass
```

### Creating your databases from scratch
There will be two different databases to support development. One will be used for unit testing (`dronepasstest`) and the other will be used for your own dev testing (`dronepass`). If these databases already exist you'll need to either drop the databases or drop the tables (`DROP SCHEMA public cascade;CREATE SCHEMA public;CREATE EXTENSION postgis;`). After you've created a database and setup it's permissions you'll need to apply the PostGIS extension to each database. In order to run SQL commands as the dronepass user you can use the psql preceding lines of SQL. In order to enable PostGIS you must connect to the psql terminal. You can exit the terminal with the `\q` command:

In terminal and psql execute the following lines:
``` bash
$ psql -c 'CREATE DATABASE dronepass;'
$ psql -c 'GRANT ALL PRIVILEGES ON DATABASE dronepass to dronepass;'
$ psql -U dronepass -d dronepass
dronepass=# CREATE EXTENSION postgis;
```

To make the unit testing version in psql execute the following lines:
``` bash
$ psql -c 'CREATE DATABASE dronepasstest;'
$ psql -c 'GRANT ALL PRIVILEGES ON DATABASE dronepasstest to dronepass;'
$ psql -U dronepass -d dronepasstest
dronepasstest=# CREATE EXTENSION postgis;
```

## Inserting Parcel Data

### Inserting Parcel Data: The Easy Way
If there is a Postgres dump file created for the planner database, then you're essentially ready to go. Execute the following dump_file import (for the unit-testing database you'll import from the ```complete_v1.sql``` at the bottom of this readme): 

```bash
$ psql --set ON_ERROR_STOP=on -d dronepass -f parcel_v1.sql
```

You're done adding the unformatted parcel data. Skip down to the "Modifying Parcel Data and Creating other tables" section to edit parcel data and create the other tables.

### Inserting Parcel Data: From Scratch (The Hard Way)
If there isn't a Postgres dump file you'll need to fill out your database in a series of steps, by collecting the county data and constructing the tables for the database. 

### Preparing the spatial reference information
In testing dronePass-Planner we've committed to using Alameda County parcel data, and in order to project that data into a spatial reference that uses meters we must add two spatial references to our dronepass and our dronepasstestdb databases. That requires inserting spatial references into the `spatial_ref_sys` table. Alameda county uses the California State Plane III projection in feet ([http://epsg.io/102643](http://epsg.io/102643)) and we'll be projecting that to meters ([http://epsg.io/102243](http://epsg.io/102243)). The following are the insertion commands (each of these insertions are brutally long and can be inspected on their respective epsg.io pages):

Execute the following lines in the psql terminal after connecting to the ```dronepass``` database:
``` SQL
INSERT into spatial_ref_sys (srid, auth_name, auth_srid, proj4text, srtext) values ( 102643, 'ESRI', 102643, '+proj=lcc +lat_1=37.06666666666667 +lat_2=38.43333333333333 +lat_0=36.5 +lon_0=-120.5 +x_0=2000000 +y_0=500000.0000000002 +datum=NAD83 +units=us-ft +no_defs ', 'PROJCS["NAD_1983_StatePlane_California_III_FIPS_0403_Feet",GEOGCS["GCS_North_American_1983",DATUM["North_American_Datum_1983",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["False_Easting",6561666.666666666],PARAMETER["False_Northing",1640416.666666667],PARAMETER["Central_Meridian",-120.5],PARAMETER["Standard_Parallel_1",37.06666666666667],PARAMETER["Standard_Parallel_2",38.43333333333333],PARAMETER["Latitude_Of_Origin",36.5],UNIT["Foot_US",0.30480060960121924],AUTHORITY["EPSG","102643"]]');
INSERT into spatial_ref_sys (srid, auth_name, auth_srid, proj4text, srtext) values ( 102243, 'ESRI', 102243, '+proj=lcc +lat_1=37.06666666666667 +lat_2=38.43333333333333 +lat_0=36.5 +lon_0=-120.5 +x_0=2000000 +y_0=500000 +ellps=GRS80 +units=m +no_defs ', 'PROJCS["NAD_1983_HARN_StatePlane_California_III_FIPS_0403",GEOGCS["GCS_North_American_1983_HARN",DATUM["NAD83_High_Accuracy_Regional_Network",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["False_Easting",2000000],PARAMETER["False_Northing",500000],PARAMETER["Central_Meridian",-120.5],PARAMETER["Standard_Parallel_1",37.06666666666667],PARAMETER["Standard_Parallel_2",38.43333333333333],PARAMETER["Latitude_Of_Origin",36.5],UNIT["Meter",1],AUTHORITY["EPSG","102243"]]');
```

Now when you query your database you'll see the following tables:

Schema  | Name | Type  |    Owner     
------------- | ------------- | ------------- | ------------- 
public    | spatial_ref_sys | table  | dronepass

### Copying Alameda County Data into Database
As of the writing of this README(Dec 31, 2014) the data for alameda county is located at the county's [geospatial map files portal](https://www.acgov.org/government/geospatial.htm), the zip file is located at the following address: [https://www.acgov.org/maps/geospatial/geospatial.zip](https://www.acgov.org/maps/geospatial/geospatial.zip). The file is a 200Mb zip file that contains an ESRI shapefile representation of the parcel data. If you don't have a GUI client you will need to download the file via lynx (`$ brew install lynx`) in order to get this data into your database server. If using lynx to save the data to your current directory: 

```bash
$ lynx -source https://www.acgov.org/maps/geospatial/geospatial.zip > geospatial.zip
```

After copying the data from the alameda GIS portal you'll need to use the Postgres `shp2pgsql` program to copy the extracted geospatial shapefile into the appropriate table in your database. The first table we're copying to is the `parcel` table and that requires a projection from the feet based coordinate system (102643) to the meter based system (102243).

```bash
$ shp2pgsql -s 102643:102243 -c -g lot_geom ./geospatial/Geospatial public.parcel | psql -U dronepass -d dronepass -h <host>
```

Now you have the `parcel` table filled with all the Alameda county parce geometries in the 102243 projection. We're also going to keep a set of geometries in WGS84 geographic coordinates in the `parcel_wgs84` table for front end rendering [http://epsg.io/4326](http://epsg.io/4326).

```bash
$ shp2pgsql -s 102643:4326 -c -g lot_geom ./geospatial/Geospatial public.parcel_wgs84 | psql -U dronepass -d dronepass -h <host>
```

Your tables should now look like the following:

Schema  | Name | Type  |    Owner     
------------- | ------------- | ------------- | ------------- 
public    | parcel              | table  | dronepass
public    | parcel_wgs84        | table  | dronepass
public    | spatial_ref_sys     | table  | dronepass

Now create a pristine Postgres dump file for future use:
```bash
$ pg_dump dronepass > parcel_v1.sql
```

## Modifying Parcel Data and Creating other tables

### Creating the rest of the tables for the database
Now you’ll need to create the rest of the tables for the database by running the sql Drone_Pass_Control_create.sql script:

```bash
$ psql -d dronepass -a -f Drone_Pass_Control_create.sql
```

### Cleaning up the Alameda county data
Alameda county has a number of columns that are not of any use to DronePass. The `Prepare_Parcel_Data.sql` file drops all those columns that are not to be used. There is also a spatial index on public.parcel lot_geom that is applied by the `Prepare_Parcel_Data.sql` file.

```base
$ psql -d dronepass -a -f Prepare_Parcel_Data.sql
```

Afterwards your tables should look like the following:

 Schema  | Name | Type  |    Owner       
------------- | ------------- | ------------- | ------------- 
 public | drone                         | table | dronepass
 public | drone_operator         | table | dronepass
 public | drone_position          | table | dronepass
 public | flight_path                 | table | dronepass
 public | flight_path_buffered  | table | dronepass
 public | land_owner               | table | dronepass
 public | landing_zone            | table | dronepass
 public | owned_parcel           | table | dronepass
 public | parcel                        | table | dronepass
 public | parcel_wgs84                        | table | dronepass
 public | restriction_exception | table | dronepass
 public | spatial_ref_sys          | table | dronepass

### Creating a Postgres Backup File
Now that you've got your database setup, you should create a backup of the initial state of the database using the Postgres `pg_dump` command:

```bash
$ pg_dump dronepass > complete_v1.sql
```

### Create Testing Database
Now that you've generated the backup dump file, make sure to update the `dronepasstest` database
```bash
$ psql --set ON_ERROR_STOP=on -d dronepasstest -f complete_v1.sql
```
