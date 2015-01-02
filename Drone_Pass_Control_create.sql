-- Created by Vertabelo (http://vertabelo.com)
-- Script type: create
-- Scope: [tables, references, sequences, views, procedures]
-- Generated at Fri Jan 02 02:49:20 UTC 2015

-- CREATE DATABASE dronePassTestDB;
-- GRANT ALL PRIVILEGES ON DATABASE dronePassTestDB to davidraleigh



-- tables
-- Table: drone
CREATE TABLE drone (
    id int  NOT NULL,
    drone_type char(64)  NOT NULL,
    max_velocity int  NOT NULL,
    CONSTRAINT drone_pk PRIMARY KEY (id)
);



-- Table: drone_operator
CREATE TABLE drone_operator (
    id int  NOT NULL,
    opeartor_name varchar(128)  NULL,
    CONSTRAINT drone_operator_pk PRIMARY KEY (id)
);



-- Table: drone_position
CREATE TABLE drone_position (
    gid int  NOT NULL,
    drone_id int  NOT NULL,
    -- position_geom geometry(POINT)  NOT NULL,
    heading int  NULL CHECK (heading > -1 AND heading < 360),
    epoch timestamp  NOT NULL,
    CONSTRAINT drone_position_pk PRIMARY KEY (gid)
);



-- Table: flight_path
CREATE TABLE flight_path (
    id int  NOT NULL,
    drone_id int  NOT NULL,
    drone_operator_id int  NOT NULL,
    -- path_geom geometry(LINESTRING)  NOT NULL,
    flight_start timestamp  NOT NULL DEFAULT -infinity CHECK (flight_start < flight_end),
    flight_end timestamp  NOT NULL DEFAULT infinity CHECK (flight_start < flight_end),
    CONSTRAINT flight_path_pk PRIMARY KEY (id)
);



-- Table: flight_path_buffered
CREATE TABLE flight_path_buffered (
    gid int  NOT NULL,
    flight_path_id int  NOT NULL,
    -- buffered_geom geometry(POLYGON)  NOT NULL,
    CONSTRAINT flight_path_buffered_pk PRIMARY KEY (gid)
);



-- Table: land_owner
CREATE TABLE land_owner (
    id int  NOT NULL,
    login varchar(255)  NOT NULL,
    owner_authority int  NOT NULL DEFAULT 0,
    CONSTRAINT land_owner_pk PRIMARY KEY (id)
);



-- Table: landing_zone
CREATE TABLE landing_zone (
    gid int  NOT NULL,
    owned_parcel_gid int  NOT NULL,
    -- zone_geom geometry(POLYGON)  NOT NULL,
    CONSTRAINT landing_zone_pk PRIMARY KEY (gid)
);



-- Table: owned_parcel
CREATE TABLE owned_parcel (
    gid int  NOT NULL,
    land_owner_id int  NOT NULL,
    parcel_gid int  NOT NULL,
    -- hull_geom geometry(POLYGON)  NOT NULL,
    restriction_height int  NULL,
    restriction_start time  NULL,
    restriction_end time  NULL,
    CONSTRAINT owned_parcel_pk PRIMARY KEY (gid)
);



-- Table: parcel
--CREATE TABLE parcel (
--    gid int  NOT NULL,
--    lot_geom geometry(POLYGON)  NOT NULL,
--    height int  NULL,
--    APN varchar(64)  NOT NULL,
--    CONSTRAINT parcel_pk PRIMARY KEY (gid)
--);



-- Table: parcel_wgs84
--CREATE TABLE parcel_wgs84 (
--    gid int  NOT NULL,
--    lot_geom geometry(POLYGON)  NOT NULL,
--    parcel_gid int  NOT NULL,
--    APN varchar(64)  NOT NULL,
--    CONSTRAINT parcel_wgs84_pk PRIMARY KEY (gid)
--);



-- Table: restriction_exception
CREATE TABLE restriction_exception (
    id int  NOT NULL,
    drone_id int  NOT NULL,
    owned_parcel_gid int  NOT NULL,
    exception_start timestamp  NOT NULL DEFAULT -infinity CHECK (exception_start < exception_end),
    exception_end timestamp  NOT NULL DEFAULT infinity CHECK (exception_start < exception_end),
    CONSTRAINT restriction_exception_pk PRIMARY KEY (id)
);







-- foreign keys
-- Reference:  drone_movement_drone (table: drone_position)


ALTER TABLE drone_position ADD CONSTRAINT drone_movement_drone 
    FOREIGN KEY (drone_id)
    REFERENCES drone (id)
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE 
;

-- Reference:  edited_parcel_land_owner (table: owned_parcel)


ALTER TABLE owned_parcel ADD CONSTRAINT edited_parcel_land_owner 
    FOREIGN KEY (land_owner_id)
    REFERENCES land_owner (id)
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE 
;

-- Reference:  edited_parcel_parcel (table: owned_parcel)


ALTER TABLE owned_parcel ADD CONSTRAINT edited_parcel_parcel 
    FOREIGN KEY (parcel_gid)
    REFERENCES parcel (gid)
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE 
;

-- Reference:  flight_path_buffered_flight_path (table: flight_path_buffered)


ALTER TABLE flight_path_buffered ADD CONSTRAINT flight_path_buffered_flight_path 
    FOREIGN KEY (flight_path_id)
    REFERENCES flight_path (id)
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE 
;

-- Reference:  flight_path_drone (table: flight_path)


ALTER TABLE flight_path ADD CONSTRAINT flight_path_drone 
    FOREIGN KEY (drone_id)
    REFERENCES drone (id)
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE 
;

-- Reference:  flight_path_drone_operator (table: flight_path)


ALTER TABLE flight_path ADD CONSTRAINT flight_path_drone_operator 
    FOREIGN KEY (drone_operator_id)
    REFERENCES drone_operator (id)
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE 
;

-- Reference:  landing_zone_owned_parcel (table: landing_zone)


ALTER TABLE landing_zone ADD CONSTRAINT landing_zone_owned_parcel 
    FOREIGN KEY (owned_parcel_gid)
    REFERENCES owned_parcel (gid)
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE 
;

-- Reference:  parcel_wgs84_parcel (table: parcel_wgs84)


--ALTER TABLE parcel_wgs84 ADD CONSTRAINT parcel_wgs84_parcel 
--    FOREIGN KEY (parcel_gid)
--    REFERENCES parcel (gid)
--    NOT DEFERRABLE 
--    INITIALLY IMMEDIATE 
--;

-- Reference:  restriction_exception_drone (table: restriction_exception)


ALTER TABLE restriction_exception ADD CONSTRAINT restriction_exception_drone 
    FOREIGN KEY (drone_id)
    REFERENCES drone (id)
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE 
;

-- Reference:  restriction_exception_edited_parcel (table: restriction_exception)


ALTER TABLE restriction_exception ADD CONSTRAINT restriction_exception_edited_parcel 
    FOREIGN KEY (owned_parcel_gid)
    REFERENCES owned_parcel (gid)
    NOT DEFERRABLE 
    INITIALLY IMMEDIATE 
;




-- adds buffered geometry for parcel to test drone movements against
SELECT AddGeometryColumn('owned_parcel', 'hull_geom', 102243, 'MULTIPOLYGON', 3, false);

-- landing zone as dictated by the pilot
SELECT AddGeometryColumn('landing_zone', 'zone_geom', 102243, 'POLYGON', 3, false);

-- position updates of the drone
SELECT AddGeometryColumn('drone_position', 'position_geom', 102243, 'POINT', 3, false);

-- flight path suggested by drone pilot and accepted by planner
SELECT AddGeometryColumn('flight_path', 'path_geom', 102243, 'LINESTRING', 3, false);

-- flight path buffered will be created server side after the flight path has been accepted by the server side 
SELECT AddGeometryColumn('flight_path_buffered', 'buffered_geom', 102243, 'POLYGON', 3, false);

-- THIS ASSUMES YOU"VE ALREADY ADDED THE PARCEL DATA USING shp2pgsql
-- it's nicer to not repeat the ALTER TABLE public.parcel line,
-- but repeating it prevents stopping the drop process if one
-- table has already been dropped elsewhere
ALTER TABLE public.parcel DROP COLUMN book;
ALTER TABLE public.parcel DROP COLUMN page;
ALTER TABLE public.parcel DROP COLUMN parcel;
ALTER TABLE public.parcel DROP COLUMN sub_parcel;
ALTER TABLE public.parcel DROP COLUMN clca_categ;
ALTER TABLE public.parcel DROP COLUMN comments;
ALTER TABLE public.parcel DROP COLUMN date_creat;
ALTER TABLE public.parcel DROP COLUMN date_updat;
ALTER TABLE public.parcel DROP COLUMN editor;
ALTER TABLE public.parcel DROP COLUMN fid_parcel;
ALTER TABLE public.parcel DROP COLUMN centroid_x;
ALTER TABLE public.parcel DROP COLUMN centroid_y;
ALTER TABLE public.parcel DROP COLUMN shape_star;
ALTER TABLE public.parcel DROP COLUMN shape_stle;
ALTER TABLE public.parcel DROP COLUMN shape_st_1;
ALTER TABLE public.parcel DROP COLUMN shape_st_2;
ALTER TABLE public.parcel DROP COLUMN shape_st_3;
ALTER TABLE public.parcel DROP COLUMN shape_st_4;

ALTER TABLE public.parcel 
ADD COLUMN height int NOT NULL DEFAULT 0;

ALTER TABLE public.parcel_wgs84 DROP COLUMN book;
ALTER TABLE public.parcel_wgs84 DROP COLUMN page;
ALTER TABLE public.parcel_wgs84 DROP COLUMN parcel;
ALTER TABLE public.parcel_wgs84 DROP COLUMN sub_parcel;
ALTER TABLE public.parcel_wgs84 DROP COLUMN clca_categ;
ALTER TABLE public.parcel_wgs84 DROP COLUMN comments;
ALTER TABLE public.parcel_wgs84 DROP COLUMN date_creat;
ALTER TABLE public.parcel_wgs84 DROP COLUMN date_updat;
ALTER TABLE public.parcel_wgs84 DROP COLUMN editor;
ALTER TABLE public.parcel_wgs84 DROP COLUMN fid_parcel;
ALTER TABLE public.parcel_wgs84 DROP COLUMN centroid_x;
ALTER TABLE public.parcel_wgs84 DROP COLUMN centroid_y;
ALTER TABLE public.parcel_wgs84 DROP COLUMN shape_star;
ALTER TABLE public.parcel_wgs84 DROP COLUMN shape_stle;
ALTER TABLE public.parcel_wgs84 DROP COLUMN shape_st_1;
ALTER TABLE public.parcel_wgs84 DROP COLUMN shape_st_2;
ALTER TABLE public.parcel_wgs84 DROP COLUMN shape_st_3;
ALTER TABLE public.parcel_wgs84 DROP COLUMN shape_st_4;

ALTER TABLE public.parcel_wgs84 
ADD COLUMN height int NOT NULL DEFAULT 0;

-- End of file.

