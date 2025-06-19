import 'package:application/pages/todo/todo_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:application/server/dio_instance.dart';

final todosProvider = FutureProvider<List<Todo>>((ref) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/todos');
  final todos = (res.data['todo'] as List)
      .map((json) => Todo.fromJson(json))
      .toList();
  return todos;
});

final singleTodoProvider = FutureProvider.family<Todo, String>((ref, id) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/todos/$id');
  return Todo.fromJson(res.data['todo']);
});

final todoRepositoryProvider = Provider<TodoRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return TodoRepository(dio);
});

class TodoRepository {
  final Dio _dio;
  TodoRepository(this._dio);

  Future<List<Todo>> getAllTodos() async {
    final res = await _dio.get('/todos');
    return (res.data['todo'] as List)
        .map((json) => Todo.fromJson(json))
        .toList();
  }

  Future<Todo> createTodo(TodoCreateRequest data) async {
    final res = await _dio.post('/todos', data: data.toJson());
    return Todo.fromJson(res.data['todo']);
  }

  Future<void> deleteTodo(String id) async {
    await _dio.delete('/todos/$id');
  }

  Future<Todo> updateTodo(String id, TodoCreateRequest updatedData) async {
    final res = await _dio.put('/todos/$id', data: updatedData.toJson());
    return Todo.fromJson(res.data['todo']);
  }
}
