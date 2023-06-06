package ru.saltykov.diploma.repositories;

import org.apache.ibatis.annotations.*;
import org.springframework.stereotype.Repository;
import ru.saltykov.diploma.domain.CollabUser;

import java.util.UUID;

@Repository
public interface CollabUserRepository {
    @Insert("insert into collab.users(username, displayname, password) values(#{username},#{displayname},#{password})")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    void insertUser(CollabUser user);

    @Select("select id, username, displayname from collab.users WHERE id=#{id}")
    CollabUser findUserById(@Param("id") UUID id);

    @Results({
            @Result(property = "id", column = "id"),
            @Result(property = "username", column = "username"),
            @Result(property = "displayname", column = "displayname"),
            @Result(property = "roles", column = "id", many = @Many(select = "ru.saltykov.diploma.repositories.RoleRepository.getRolesForUser"))
    })
    @Select("select id, username, displayname, password from collab.users WHERE username=#{username}")
    CollabUser findUserByUsername(@Param("username") String username);
}
