create schema collab;
create table collab.roles (
    id long not null,
    name varchar not null
);
insert into collab.roles(id, name) values (0, 'ROLE_ADMIN');
insert into collab.roles(id, name) values (1, 'ROLE_USER');
create table collab.user_roles (
    userid uuid not null,
    roleid long not null
);
create table collab.users (
    id uuid default random_uuid() primary key,
    username varchar not null,
    displayname varchar not null,
    password varchar not null
);
create table collab.files (
    id uuid default random_uuid() primary key ,
    owner uuid not null,
    sharable bool not null,
    name varchar not null
);
create index files_owner_idx ON collab.files(owner);
create index files_sharable_idx ON collab.files(sharable);
create table collab.messages (
    id uuid default random_uuid() primary key ,
    file uuid not null,
    "user" uuid not null,
    timestamp timestamp with time zone not null,
    infileid integer not null
);
create index messages_file_idx ON collab.messages(file);
create index messages_infileid_idx ON collab.messages(infileid);
create table collab.changes (
    id uuid default random_uuid() primary key ,
    file uuid not null,
    "user" uuid,
    revision long not null,
    changesstring varchar not null
);
create table collab.statuses (
    file uuid not null,
    "user" uuid not null,
    status varchar not null,
    "value" varchar
);
create index statuses_file_idx on collab.statuses(file);
create index statuses_user_idx on collab.statuses("user");
create index statuses_status_idx on collab.statuses(status);