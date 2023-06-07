package ru.saltykov.diploma.repositories;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Update;
import org.springframework.stereotype.Repository;
import ru.saltykov.diploma.domain.CollabChanges;
import ru.saltykov.diploma.domain.CollabStatus;

@Repository
public interface StatusRepository {
    @Insert("insert into collab.statuses(file, \"user\", status, \"value\") values(#{file},#{user},#{status}, #{value})")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    void insertStatus(CollabStatus collabStatus);

    @Update("update collab.statuses set \"value\" = #{value} where file = #{file} and \"user\" = {#user} and status = #{status}")
    void updateStatus(CollabStatus collabStatus);
}
