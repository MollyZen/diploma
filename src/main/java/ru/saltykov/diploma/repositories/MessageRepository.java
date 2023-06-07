package ru.saltykov.diploma.repositories;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.springframework.stereotype.Repository;
import ru.saltykov.diploma.domain.CollabMessage;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository {
    @Insert("insert into collab.messages(file, \"user\", messageid, message) values(#{file},#{user},#{messageid}, #{message})")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    void addMessage(CollabMessage message);

    @Select("select * from collab.messages where id = #{id}")
    CollabMessage getMessageById(@Param("id") UUID id);

    @Select("select * from collab.messages where file = #{file} and messageId >= #{messagesFrom}")
    List<CollabMessage> getMessages(@Param("file") UUID file, @Param("messagesFrom") Integer messagesFrom);

    @Select("select max(messageid) from collab.messages where file=#{fileid}")
    Integer getMessageHead(@Param("fileid") UUID fileid);
}
