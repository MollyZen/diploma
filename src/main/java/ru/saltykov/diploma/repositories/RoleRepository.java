package ru.saltykov.diploma.repositories;

import org.apache.ibatis.annotations.*;
import org.springframework.stereotype.Repository;
import ru.saltykov.diploma.domain.CollabRole;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoleRepository {
    @Results({
            @Result(property = "id", column = "id"),
            @Result(property = "name", column = "name")
    })
    @Select("select roles.id, roles.name from collab.roles roles inner join collab.user_roles users on users.userid = #{id} and roles.id = users.roleid")
    List<CollabRole> getRolesForUser(@Param("id") UUID id);

    @Insert("insert into collab.user_roles(roleid, userid) values(#{roleid}, #{userid})")
    void addRoleToUser(@Param("userid") UUID userId, @Param("roleid") Integer roleId);
}
