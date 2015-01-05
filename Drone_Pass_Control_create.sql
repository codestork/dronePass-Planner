-- Created by Vertabelo (http://vertabelo.com)
-- Script type: create
-- Scope: [tables, references, sequences, views, procedures]
-- Generated at Sun Jan 04 01:04:49 UTC 2015




-- tables
-- Table: drone
CREATE TABLE drone (
    id serial NOT NULL,
    call_sign varchar(32) UNIQUE NOT NULL,
    drone_type varchar(64) NOT NULL,
    max_velocity int NOT NULL,
    CONSTRAINT drone_pk PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ON drone (
    call_sign
);


-- Table: drone_operator
CREATE TABLE drone_operator (
    id serial  NOT NULL,
    operator_name varchar(128)  NULL,
    CONSTRAINT drone_operator_pk PRIMARY KEY (id)
);



-- Table: drone_position
CREATE TABLE drone_position (
    gid bigserial  NOT NULL,
    drone_id int  NOT NULL,
    -- position_geom geometry(POINT)  NOT NULL,
    heading int  NULL CHECK (heading > -1 AND heading < 360),
    epoch timestamp  NOT NULL,
    CONSTRAINT drone_position_pk PRIMARY KEY (gid)
);



-- Table: flight_path
CREATE TABLE flight_path (
    gid serial  NOT NULL,
    drone_id int  NOT NULL,
    drone_operator_id int  NOT NULL,
    -- path_geom geometry(LINESTRING)  NOT NULL,
    flight_start timestamp  NOT NULL DEFAULT '-infinity'::timestamp without time zone CHECK (flight_start < flight_end),
    flight_end timestamp  NOT NULL DEFAULT 'infinity'::timestamp without time zone CHECK (flight_start < flight_end),
    CONSTRAINT flight_path_pk PRIMARY KEY (gid)
);



-- Table: flight_path_area
CREATE TABLE flight_path_area (
    gid serial  NOT NULL,
    flight_path_gid int  NOT NULL,
    -- buffered_geom geometry(POLYGON)  NOT NULL,
    CONSTRAINT flight_path_area_pk PRIMARY KEY (gid)
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
    gid serial  NOT NULL,
    owned_parcel_gid int  NOT NULL,
    -- zone_geom geometry(POLYGON)  NOT NULL,
    CONSTRAINT landing_zone_pk PRIMARY KEY (gid)
);



-- Table: owned_parcel
CREATE TABLE owned_parcel (
    gid serial  NOT NULL,
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
--    gid serial  NOT NULL,
--    lot_geom geometry(POLYGON)  NOT NULL,
--    height int  NULL,
--    APN varchar(64)  NOT NULL,
--    CONSTRAINT parcel_pk PRIMARY KEY (gid)
--);



-- Table: parcel_wgs84
--CREATE TABLE parcel_wgs84 (
--    gid serial  NOT NULL,
--    lot_geom geometry(POLYGON)  NOT NULL,
--    parcel_gid int  NOT NULL,
--    APN varchar(64)  NOT NULL,
--    CONSTRAINT parcel_wgs84_pk PRIMARY KEY (gid)
--);



-- Table: restriction_exception
CREATE TABLE restriction_exception (
    id serial  NOT NULL,
    drone_id int  NOT NULL,
    owned_parcel_gid int  NOT NULL,
    exception_start timestamp NULL,--  NOT NULL DEFAULT "-infinity" CHECK (exception_start < exception_end),
    exception_end timestamp NULL,--NOT NULL DEFAULT "infinity" CHECK (exception_start < exception_end),
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

-- Reference:  flight_path_area_flight_path (table: flight_path_area)


ALTER TABLE flight_path_area ADD CONSTRAINT flight_path_area_flight_path 
    FOREIGN KEY (flight_path_gid)
    REFERENCES flight_path (gid)
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
SELECT AddGeometryColumn('owned_parcel', 'hull_geom', 102243, 'POLYGON', 2, false);

-- landing zone as dictated by the pilot
SELECT AddGeometryColumn('landing_zone', 'zone_geom', 102243, 'POLYGON', 2, false);

-- position updates of the drone
SELECT AddGeometryColumn('drone_position', 'position_geom', 102243, 'POINT', 2, false);

-- flight path suggested by drone pilot and accepted by planner
SELECT AddGeometryColumn('flight_path', 'path_geom', 102243, 'LINESTRING', 2, false);

-- flight path buffered will be created server side after the flight path has been accepted by the server side 
SELECT AddGeometryColumn('flight_path_area', 'buffered_geom', 102243, 'POLYGON', 2, false);

-- End of file.

