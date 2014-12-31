dronePass-Planner
=================
> Planner is the central server of the dronePass project. The server will manage permissions suggested by property owners and authorities. Drones in flight will maintain communication with Planner and adjust its flight path as permission levels change.

## Team

  - __Product Owner__: David Raleigh
  - __Scrum Master__: Liz Portnoy
  - __Development Team Members__: Dennis Lin, Arthur Chan

## Postgres setup
In order to run tests locally a developer will need a Postgres database setup with the PostGIS extension enabled. The following is the step by step process to get the database setup and running.

### Postgres
Follow the instructions on the [Postgres installation page](http://postgis.net/install/) in order to get yourself the latest and greatest 9.4 version. Postgres 9.4 only plays nicely with PostGIS 2.1 and later versions.

### Creating your databases
There will be two different databases to support development. One will be used for unit testing (dronepassdbtest) and the other will be used for your own dev testing (dronepassdb). After you've created a database and setup it's permissions you'll need to apply the PostGIS extension to each database:

`CREATE EXTENSION postgis;`

### Preparing the spatial reference information
In testing dronePass-Planner we've committed to using Alameda County parcel data, and in order to project that data into a spatial reference that uses meters we must add two spatial references to our dronepassdb and our dronepasstestdb databases. That requires inserting spatial references into the `spatial_ref_sys` table. Alameda county uses the California State Plane III projection in feet ([http://epsg.io/102643](http://epsg.io/102643)) and we'll be projecting that to meters ([http://epsg.io/102243](http://epsg.io/102243)). The following are the insertion commands (each of these insertions are brutally long and can be inspected on their respective epsg.io pages):

```INSERT into spatial_ref_sys (srid, auth_name, auth_srid, proj4text, srtext) values ( 102643, 'ESRI', 102643, '+proj=lcc +lat_1=37.06666666666667 +lat_2=38.43333333333333 +lat_0=36.5 +lon_0=-120.5 +x_0=2000000 +y_0=500000.0000000002 +datum=NAD83 +units=us-ft +no_defs ', 'PROJCS["NAD_1983_StatePlane_California_III_FIPS_0403_Feet",GEOGCS["GCS_North_American_1983",DATUM["North_American_Datum_1983",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["False_Easting",6561666.666666666],PARAMETER["False_Northing",1640416.666666667],PARAMETER["Central_Meridian",-120.5],PARAMETER["Standard_Parallel_1",37.06666666666667],PARAMETER["Standard_Parallel_2",38.43333333333333],PARAMETER["Latitude_Of_Origin",36.5],UNIT["Foot_US",0.30480060960121924],AUTHORITY["EPSG","102643"]]');```

```INSERT into spatial_ref_sys (srid, auth_name, auth_srid, proj4text, srtext) values ( 102243, 'ESRI', 102243, '+proj=lcc +lat_1=37.06666666666667 +lat_2=38.43333333333333 +lat_0=36.5 +lon_0=-120.5 +x_0=2000000 +y_0=500000 +ellps=GRS80 +units=m +no_defs ', 'PROJCS["NAD_1983_HARN_StatePlane_California_III_FIPS_0403",GEOGCS["GCS_North_American_1983_HARN",DATUM["NAD83_High_Accuracy_Regional_Network",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["False_Easting",2000000],PARAMETER["False_Northing",500000],PARAMETER["Central_Meridian",-120.5],PARAMETER["Standard_Parallel_1",37.06666666666667],PARAMETER["Standard_Parallel_2",38.43333333333333],PARAMETER["Latitude_Of_Origin",36.5],UNIT["Meter",1],AUTHORITY["EPSG","102243"]]');```
