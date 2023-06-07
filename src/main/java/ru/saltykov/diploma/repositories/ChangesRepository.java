package ru.saltykov.diploma.repositories;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Repository;
import ru.saltykov.diploma.domain.CollabChanges;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChangesRepository {
    @Insert("insert into collab.changes(file, \"user\", revision, changesstring) values(#{file},#{user},#{revision}, #{changesstring})")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    void insertChanges(CollabChanges changes);

    @Select("select * from collab.changes where id = #{id}")
    CollabChanges getChanges(@Param("id") UUID id);

    @Select("select * from collab.changes where file = #{fileid} and revision >= #{revision}")
    List<CollabChanges> getChangesFrom(@Param("fileid") UUID fileid, @Param("revision") Integer from);

    @Select("select max(revision) from collab.changes where file = #{fileid}")
    Integer getFileRevision(@Param("fileid") UUID fileid);
}
