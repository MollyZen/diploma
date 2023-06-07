package ru.saltykov.diploma.repositories;

import org.apache.ibatis.annotations.*;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Repository;
import ru.saltykov.diploma.domain.CollabUser;
import ru.saltykov.diploma.domain.FileDescription;

import java.util.List;
import java.util.UUID;

@Repository
public interface FileDescriptionRepository {

    /*@Results({
            @Result(property = "id", column = "id"),
            @Result(property = "owner", column = "owner"),
            @Result(property = "sharable", column = "sharable"),
            @Result(property = "name", column = "name"),
            @Result(property = "creationdate", column = "creationdate")
    })*/
    @Insert("insert into collab.files(owner, name) values(#{owner},#{name})")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    void createFile(FileDescription fileDescription);

    @Select("select * from collab.files WHERE owner=#{id} or sharable = true")
    List<FileDescription> getFilesAvailableToUser(@Param("id") UUID id);

    @Select("select * from collab.files WHERE sharable = true")
    List<FileDescription> getFilesAvailableToAll();

    @Select("select * from collab.files WHERE id=#{id}")
    FileDescription getFile(@Param("id") UUID id);

    @Delete("delete from collab.files where id=#{id}")
    void deleteFile(@Param("id") UUID id);
}
