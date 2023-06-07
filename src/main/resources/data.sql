create schema collab;
create table collab.roles (
    id long not null,
    name varchar not null
);
insert into collab.roles(id, name) values (0, 'ROLE_ADMIN');
insert into collab.roles(id, name) values (1, 'ROLE_USER');
create table collab.users (
    id uuid default random_uuid() primary key,
    username varchar not null,
    displayname varchar not null,
    password varchar not null
);
insert into collab.users(id, username, displayname, password) values('ca0e2954-6e4f-4875-93d4-eebd32ecf5c0', 'asd', 'asd', '$2a$10$s09JMSOPFo2.YCFisR.iOeaYV9O0qqyx3b.Xyu/bBzh/vmiwrd5Vy');
create table collab.user_roles (
    userid uuid not null,
    roleid long not null
);
insert into collab.user_roles(userid, roleid) values ('ca0e2954-6e4f-4875-93d4-eebd32ecf5c0', 1);
create table collab.files (
    id uuid default random_uuid() primary key ,
    owner uuid not null,
    sharable bool not null default false,
    name varchar not null,
    creationdate integer not null default EXTRACT (EPOCH from CURRENT_TIMESTAMP())
);
create index files_owner_idx ON collab.files(owner);
create index files_sharable_idx ON collab.files(sharable);
create table collab.messages (
    id uuid default random_uuid() primary key ,
    file uuid not null,
    "user" uuid,
    timestamp long not null default EXTRACT (EPOCH from CURRENT_TIMESTAMP()),
    messageid integer not null,
    message varchar not null
);
create index messages_file_idx ON collab.messages(file);
create index messages_infileid_idx ON collab.messages(messageid);
create table collab.changes (
    id uuid default random_uuid() primary key ,
    file uuid not null,
    "user" uuid,
    revision integer not null,
    changesstring varchar not null
);
create table collab.statuses (
    file uuid not null,
    "user" uuid not null,
    status varchar not null,
    "value" varchar not null
);
create index statuses_file_idx on collab.statuses(file);
create index statuses_user_idx on collab.statuses("user");
create index statuses_status_idx on collab.statuses(status);